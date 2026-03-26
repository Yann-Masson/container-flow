import { state } from '../client';

const PHP_INI_CONTENT = `; Custom PHP settings injected by Container Flow
upload_max_filesize = 512M
post_max_size = 512M
memory_limit = 512M
max_execution_time = 300
max_input_time = 300
`;

// Directory/path use $HOME as a placeholder; the real path is resolved at runtime.
const REMOTE_PHP_INI_DIR_TEMPLATE = '~/.container-flow/php';
const REMOTE_PHP_INI_FILENAME = 'wordpress-custom.ini';

// Exported for reference only — contains unresolved ~. Use the value
// returned by ensureWordpressPhpIni() for Docker bind mounts.
export const REMOTE_PHP_INI_PATH = `${REMOTE_PHP_INI_DIR_TEMPLATE}/${REMOTE_PHP_INI_FILENAME}`;

/**
 * Creates the PHP ini dir and writes the file on the VPS in a single exec call.
 * Returns the resolved absolute path (e.g. /root/.container-flow/php/wordpress-custom.ini)
 * so Docker can use it as a bind mount source.
 */
export function ensureWordpressPhpIni(): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!state.sshClient || !state.connected) {
            reject(new Error('SSH client not connected'));
            return;
        }

        const encoded = Buffer.from(PHP_INI_CONTENT).toString('base64');
        // Resolve $HOME first, then create dir + write file, then print resolved path.
        const cmd = [
            `DIR=$(eval echo ${REMOTE_PHP_INI_DIR_TEMPLATE})`,
            `mkdir -p "$DIR"`,
            `echo '${encoded}' | base64 -d > "$DIR/${REMOTE_PHP_INI_FILENAME}"`,
            `echo "$DIR/${REMOTE_PHP_INI_FILENAME}"`,
        ].join(' && ');

        state.sshClient.exec(cmd, (execErr, stream) => {
            if (execErr) {
                reject(new Error(`PHP ini exec failed: ${execErr.message}`));
                return;
            }

            const stdoutChunks: Buffer[] = [];
            const stderrChunks: Buffer[] = [];
            stream.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
            stream.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

            stream.on('close', (code: number) => {
                if (code !== 0) {
                    const errMsg = Buffer.concat(stderrChunks).toString().trim();
                    reject(new Error(`PHP ini setup failed (exit ${code}): ${errMsg}`));
                    return;
                }
                const resolvedPath = Buffer.concat(stdoutChunks).toString().trim();
                console.log(`PHP ini written to VPS: ${resolvedPath}`);
                resolve(resolvedPath);
            });
        });
    });
}
