import { getClient } from '../../../client';
import { create as createContainer } from '../../../containers/create';
import { start as startContainer } from '../../../containers/start';
import { stop as stopContainer } from '../../../containers/stop';
import { remove as removeContainer } from '../../../containers/remove';
import { getByName as getContainerByName } from '../../../containers/get-by-name';
import { list as listContainers } from '../../../containers/list';
import connectToNetwork from '../../../network/connect';
import mysqlConfigModule from '../../../configs/mysql';
import passwordManager from '../../../../runtime/passwords';
import validate from '../../validate';
import { EnsureContext } from './types';
import { state, getClient as getDockerClient } from '../../../client';

type WordPressDbCredential = {
    dbName: string;
    dbUser: string;
    dbPassword: string;
};

function shellEscapeSingleQuoted(value: string): string {
    return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function runSshCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        if (!state.sshClient || !state.connected) {
            reject(new Error('SSH client not connected'));
            return;
        }

        state.sshClient.exec(command, (err, stream) => {
            if (err) {
                reject(err);
                return;
            }

            let stdout = '';
            let stderr = '';

            stream.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            stream.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            stream.on('close', (code: number | null) => {
                if (code !== 0 && code !== null) {
                    const details = (stderr || stdout || '').trim();
                    reject(
                        new Error(
                            `Command failed with code ${code}${details ? `: ${details}` : ''}. Command: ${command}`,
                        ),
                    );
                    return;
                }
                resolve({ stdout, stderr });
            });
        });
    });
}

async function waitForMysqlInContainer(rootPassword: string, retries = 24): Promise<void> {
    const escapedPassword = shellEscapeSingleQuoted(rootPassword);
    const cmd = `docker exec -e MYSQL_PWD=${escapedPassword} mysql mysqladmin -uroot ping --silent`;

    for (let i = 0; i < retries; i++) {
        try {
            await runSshCommand(cmd);
            return;
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }

    throw new Error('MySQL is not ready after multiple retries');
}

async function listUserDatabases(rootPassword: string): Promise<string[]> {
    const escapedPassword = shellEscapeSingleQuoted(rootPassword);
    const sql = "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('mysql','information_schema','performance_schema','sys') ORDER BY schema_name";
    const listCmd = `docker exec -e MYSQL_PWD=${escapedPassword} mysql mysql -uroot -Nse ${shellEscapeSingleQuoted(sql)}`;
    const result = await runSshCommand(listCmd);
    return result.stdout
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

function getEnvValue(env: string[] | undefined, key: string): string | undefined {
    const prefix = `${key}=`;
    return env?.find((entry) => entry.startsWith(prefix))?.slice(prefix.length);
}

async function collectWordPressDbCredentials(): Promise<WordPressDbCredential[]> {
    const client = getDockerClient();
    if (!client) throw new Error('Docker client not initialized');

    const containers = await listContainers();
    const wordpress = containers.filter(
        (c) => c.Labels && c.Labels['container-flow.type'] === 'wordpress',
    );

    const map = new Map<string, WordPressDbCredential>();
    for (const c of wordpress) {
        try {
            const inspected = await client.getContainer(c.Id).inspect();
            const env = inspected.Config?.Env;
            const dbName = getEnvValue(env, 'WORDPRESS_DB_NAME');
            const dbUser = getEnvValue(env, 'WORDPRESS_DB_USER');
            const dbPassword = getEnvValue(env, 'WORDPRESS_DB_PASSWORD');

            if (!dbName || !dbUser || !dbPassword) continue;

            // Deduplicate by dbName+dbUser pair.
            map.set(`${dbName}::${dbUser}`, { dbName, dbUser, dbPassword });
        } catch {
            // Ignore single-container inspect failures and continue.
        }
    }

    return Array.from(map.values());
}

function escapeSqlString(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

function escapeSqlIdentifier(value: string): string {
    return value.replace(/`/g, '``');
}

async function restoreWordPressUsersAndGrants(
    rootPassword: string,
    credentials: WordPressDbCredential[],
    progress?: EnsureContext['progress'],
): Promise<void> {
    const escapedPassword = shellEscapeSingleQuoted(rootPassword);

    for (const cred of credentials) {
        const dbName = escapeSqlIdentifier(cred.dbName);
        const dbUser = escapeSqlString(cred.dbUser);
        const dbPassword = escapeSqlString(cred.dbPassword);

        const sql = [
            `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
            `DROP USER IF EXISTS '${dbUser}'@'%'`,
            `CREATE USER '${dbUser}'@'%' IDENTIFIED BY '${dbPassword}'`,
            `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%'`,
            `DROP USER IF EXISTS '${dbUser}'@'localhost'`,
            `CREATE USER '${dbUser}'@'localhost' IDENTIFIED BY '${dbPassword}'`,
            `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'localhost'`,
            'FLUSH PRIVILEGES',
        ].join('; ');

        const cmd = `docker exec -e MYSQL_PWD=${escapedPassword} mysql mysql -uroot -e ${shellEscapeSingleQuoted(sql)}`;
        try {
            await runSshCommand(cmd);
        } catch (error) {
            const errDetails = error instanceof Error ? error.message : String(error);
            console.error(`Could not recreate grants for ${cred.dbUser}@${cred.dbName}:`, errDetails);
            progress?.(
                'mysql',
                'error',
                `Could not recreate grants for ${cred.dbUser}@${cred.dbName}: ${errDetails}`,
            );
            throw new Error(`Failed to recreate grants for ${cred.dbUser}: ${errDetails}`);
        }
    }

    if (credentials.length > 0) {
        progress?.('mysql', 'starting', `Recreated ${credentials.length} WordPress DB user(s)/grant(s)`);
    }
}

async function verifyWordPressDbCredentials(
    credentials: WordPressDbCredential[],
    progress?: EnsureContext['progress'],
): Promise<void> {
    if (credentials.length === 0) {
        progress?.('mysql', 'starting', 'No WordPress DB credentials found to verify');
        return;
    }

    const failed: string[] = [];
    for (const cred of credentials) {
        const user = shellEscapeSingleQuoted(cred.dbUser);
        const pass = shellEscapeSingleQuoted(cred.dbPassword);
        const db = shellEscapeSingleQuoted(cred.dbName);
        const cmd = `docker exec -e MYSQL_PWD=${pass} mysql mysql -h 127.0.0.1 -u ${user} -D ${db} -e 'SELECT 1'`;

        try {
            await runSshCommand(cmd);
        } catch (error) {
            console.error(`Verification failed for ${cred.dbUser}:`, error);
            const errDetails = error instanceof Error ? error.message : String(error);
            failed.push(`${cred.dbUser}@${cred.dbName} [${errDetails}]`);
            
            progress?.(
                'mysql',
                'error',
                `Verification failed for ${cred.dbUser}: ${errDetails}`
            );
        }
    }

    if (failed.length > 0) {
        throw new Error(`WordPress DB credential verification failed for: \n${failed.join('\n')}`);
    }

    progress?.('mysql', 'starting', `Verified ${credentials.length} WordPress DB credential(s)`);
}

async function backupAndRebuildMysql(
    existingId: string,
    rootPassword: string,
    expected: ReturnType<typeof mysqlConfigModule.buildMySqlConfig>,
    progress?: EnsureContext['progress'],
): Promise<void> {
    const escapedPassword = shellEscapeSingleQuoted(rootPassword);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `mysql-backup-${timestamp}.sql`;
    const backupDir = '$HOME/.container-flow/mysql-backups';
    const backupPath = `${backupDir}/${backupFile}`;
    const wordpressCredentials = await collectWordPressDbCredentials();

    progress?.('mysql', 'starting', 'Starting force migration backup (application databases)...');

    try {
        await startContainer(existingId);
    } catch {
        // Already running or managed by Docker restart policy
    }

    await waitForMysqlInContainer(rootPassword);

    const userDatabases = await listUserDatabases(rootPassword);
    const hasUserData = userDatabases.length > 0;
    if (hasUserData) {
        progress?.('mysql', 'starting', `Databases to migrate: ${userDatabases.join(', ')}`);
    } else {
        progress?.('mysql', 'starting', 'No non-system databases found; rebuild will skip dump/restore');
    }

    if (hasUserData) {
        const escapedDatabases = userDatabases.map(shellEscapeSingleQuoted).join(' ');
        const backupCmd =
            `BACKUP_DIR="$HOME/.container-flow/mysql-backups"; ` +
            `BACKUP_PATH="$BACKUP_DIR/${backupFile}"; ` +
            `set -e; ` +
            `mkdir -p "$BACKUP_DIR" && ` +
            `docker exec -e MYSQL_PWD=${escapedPassword} mysql ` +
            `mysqldump -uroot --single-transaction --routines --events --triggers --set-gtid-purged=OFF --databases ${escapedDatabases} ` +
            `> "$BACKUP_PATH" && ` +
            `test -s "$BACKUP_PATH"`;

        await runSshCommand(backupCmd);
        progress?.('mysql', 'starting', `Backup created: ${backupPath}`);
    }

    try {
        await stopContainer(existingId, { t: 60 });
    } catch {
        // Best effort stop before removal.
    }

    await removeContainer(existingId, { force: true, volume: false });

    const client = getDockerClient();
    if (!client) throw new Error('Docker client not initialized');

    try {
        const volume = client.getVolume('mysql-data');
        await volume.remove({ force: true });
        progress?.('mysql', 'starting', 'Removed old mysql-data volume');
    } catch {
        progress?.('mysql', 'starting', 'mysql-data volume not found or already removed');
    }

    const created = await createContainer(expected);
    await connectToNetwork('CF-WP', { Container: created.id });
    await startContainer(created.id);

    await waitForMysqlInContainer(rootPassword);
    progress?.('mysql', 'starting', 'Fresh MySQL container is ready');
    
    if (hasUserData) {
        progress?.('mysql', 'starting', 'Restoring MySQL backup into fresh volume...');

        const restoreCmd =
            `BACKUP_PATH="$HOME/.container-flow/mysql-backups/${backupFile}"; ` +
            `test -s "$BACKUP_PATH" && ` +
            `docker exec -i -e MYSQL_PWD=${escapedPassword} mysql mysql -uroot -f ` +
            `< "$BACKUP_PATH"`;
        await runSshCommand(restoreCmd);
    }

    await restoreWordPressUsersAndGrants(rootPassword, wordpressCredentials, progress);
    await verifyWordPressDbCredentials(wordpressCredentials, progress);
}

export async function ensureMySQL(ctx: EnsureContext): Promise<void> {
    const { force, progress } = ctx;
    progress?.('mysql', 'starting', 'Checking MySQL container...');

    const client = getClient();
    if (!client) throw new Error('Docker client not initialized');

    const existing = await getContainerByName('mysql');
    const rootPassword = passwordManager.getState().root?.password;

    if (existing) {
        const container = client.getContainer(existing.id);
        const info = await container.inspect();
        // Build expected config only if we have a root password; otherwise skip strict validation (user will be prompted)
        const expected = rootPassword
            ? mysqlConfigModule.buildMySqlConfig(rootPassword)
            : undefined;
        const hasConfigMismatch = expected ? !validate.containerConfig(info, expected) : false;

        if (expected && (force || hasConfigMismatch)) {
            if (!force && hasConfigMismatch) {
                const msg =
                    'MySQL container exists but has invalid configuration. Use force=true to recreate.';
                progress?.('mysql', 'error', msg);
                throw new Error(msg);
            }
            progress?.('mysql', 'starting', 'Force mode enabled: backing up and rebuilding MySQL...');
            if (!rootPassword) {
                throw new Error(
                    'Root password missing; cannot recreate MySQL. Provide credentials first.',
                );
            }

            await backupAndRebuildMysql(existing.id, rootPassword, expected, progress);
            progress?.('mysql', 'success', 'MySQL container recreated');
            return;
        }
        try {
            await connectToNetwork('CF-WP', { Container: existing.id });
        } catch {
            // Network connection may already exist, safe to ignore
        }
        if (info.State.Status !== 'running') await startContainer(existing.id);
        progress?.('mysql', 'success', 'MySQL container ready');
        return;
    }

    if (!rootPassword) {
        const msg = 'Root password not set; cannot create MySQL container.';
        progress?.('mysql', 'error', msg);
        throw new Error(msg);
    }

    const mysqlConfig = mysqlConfigModule.buildMySqlConfig(rootPassword);
    const created = await createContainer(mysqlConfig);
    await connectToNetwork('CF-WP', { Container: created.id });
    await startContainer(created.id);
    progress?.('mysql', 'success', 'MySQL container created');
    return;
}
