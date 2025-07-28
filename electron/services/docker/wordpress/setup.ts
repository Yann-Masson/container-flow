import { ContainerCreateOptions, ContainerInspectInfo, NetworkInspectInfo } from 'dockerode';
import mysql from 'mysql2/promise';
import { createMySQLTunnel, getClient, getMySQLConnectionOptions } from '../client';
import { create as createContainer } from '../containers/create';
import { start as startContainer } from '../containers/start';
import { remove as removeContainer } from '../containers/remove';
import { getByName as getContainerByName } from '../containers/get-by-name';
import createNetwork from '../network/create';
import connectToNetwork from '../network/connect';
import inspectNetwork from '../network/inspect';
import listNetworks from '../network/list';
import removeNetwork from '../network/remove';
import traefik from '../configs/traefik';
import mysqlConfig from '../configs/mysql';
import wordpress from '../configs/wordpress';

// Types for WordPress container creation
interface WordPressSetupOptions {
    name: string;
    domain?: string;
}

interface MySQLConnectionOptions {
    host: string;
    port: number;
    user: string;
    password: string;
    database?: string;
}

// Event emitter for setup progress
type ProgressCallback = (step: string, status: 'starting' | 'completed' | 'error', message?: string) => void;

// Configuration validation interface
interface SetupOptions {
    force?: boolean;
}

/**
 * Validate if a network has the correct configuration
 */
const validateNetworkConfig = (networkInfo: NetworkInspectInfo): boolean => {
    return networkInfo.Driver === 'bridge' && networkInfo.Name === 'CF-WP';
};

/**
 * Validate if a container has the correct configuration
 */
const validateContainerConfig = (containerInfo: ContainerInspectInfo, expectedConfig: ContainerCreateOptions): boolean => {
    // Basic validation - check image and key environment variables
    // Docker stores images as SHA256 hashes after pulling, so we need to check the RepoTags
    const expectedImage = expectedConfig.Image;
    const actualImage = containerInfo.Image;
    const repoTags = containerInfo.Config?.Image || '';

    // Check if the image matches either by name or if the RepoTags contain the expected image
    const imageMatches = actualImage === expectedImage ||
        repoTags === expectedImage ||
        (actualImage.startsWith('sha256:') && repoTags === expectedImage);

    if (!imageMatches) {
        console.warn(`Container image mismatch: expected ${expectedImage}, got ${actualImage} (RepoTags: ${repoTags})`);
        return false;
    }

    // For MySQL, check if root password env is set
    if (expectedConfig.name === 'mysql') {
        return containerInfo.Config?.Env?.some((env: string) =>
            env.startsWith('MYSQL_ROOT_PASSWORD=')
        ) ?? false;
    }

    // For Traefik, check if it has the required labels
    if (expectedConfig.name === 'traefik') {
        const labels = containerInfo.Config?.Labels || {};
        return labels['traefik.enable'] === 'true';
    }

    return true;
};

/**
 * Setup the complete WordPress infrastructure
 * Creates network, Traefik and MySQL containers
 */
export const setup = async (
    options: SetupOptions = {},
    progressCallback?: ProgressCallback
): Promise<{
    network: { id: string; name: string };
    traefik: { id: string; name: string };
    mysql: { id: string; name: string };
}> => {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    const { force = false } = options;

    console.log('Starting WordPress infrastructure setup...');
    progressCallback?.('setup', 'starting', 'Starting WordPress infrastructure setup...');

    try {
        let network: { id: string; name?: string };
        let traefikContainer: { id: string; name?: string };
        let mysqlContainer: { id: string; name?: string };

        // 1. Check and handle network 'CF-WP'
        progressCallback?.('network', 'starting', 'Checking network CF-WP...');
        console.log('Checking network CF-WP...');

        const existingNetworks = await listNetworks({ filters: { name: ['CF-WP'] } });
        const existingNetwork = existingNetworks.find(n => n.Name === 'CF-WP');

        if (existingNetwork) {
            console.log('Network CF-WP already exists, validating configuration...');
            const networkInfo = await inspectNetwork('CF-WP');

            if (!validateNetworkConfig(networkInfo)) {
                if (force) {
                    console.log('Invalid network configuration, removing and recreating...');
                    progressCallback?.('network', 'starting', 'Removing invalid network configuration...');
                    await removeNetwork('CF-WP', true);
                    network = await createNetwork({
                        Name: 'CF-WP',
                        Driver: 'bridge',
                    });
                } else {
                    const error = new Error('Network CF-WP exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('network', 'error', error.message);
                    throw error;
                }
            } else {
                console.log('Network CF-WP configuration is valid');
                network = { id: existingNetwork.Id, name: 'CF-WP' };
            }
        } else {
            console.log('Creating network CF-WP...');
            network = await createNetwork({
                Name: 'CF-WP',
                Driver: 'bridge',
            });
        }
        progressCallback?.('network', 'completed', 'Network CF-WP ready');

        // 2. Check and handle Traefik container
        progressCallback?.('traefik', 'starting', 'Checking Traefik container...');
        console.log('Checking Traefik container...');

        const existingTraefik = await getContainerByName('traefik');

        if (existingTraefik) {
            console.log('Traefik container already exists, validating configuration...');
            const container = client.getContainer(existingTraefik.id);
            const containerInfo = await container.inspect();

            if (!validateContainerConfig(containerInfo, traefik)) {
                if (force) {
                    console.log('Invalid Traefik configuration, removing and recreating...');
                    progressCallback?.('traefik', 'starting', 'Removing invalid Traefik configuration...');
                    await removeContainer(existingTraefik.id, { force: true, v: true });
                    traefikContainer = await createContainer(traefik);
                    await connectToNetwork('CF-WP', { Container: traefikContainer.id });
                    await startContainer(traefikContainer.id);
                } else {
                    const error = new Error('Traefik container exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('traefik', 'error', error.message);
                    throw error;
                }
            } else {
                console.log('Traefik container configuration is valid');
                traefikContainer = existingTraefik;
                // Ensure it's connected to the network
                try {
                    await connectToNetwork('CF-WP', { Container: traefikContainer.id });
                } catch (error) {
                    // Container might already be connected, ignore the error
                    console.log('Container might already be connected to network');
                }
                // Ensure it's started
                if (containerInfo.State.Status !== 'running') {
                    await startContainer(traefikContainer.id);
                }
            }
        } else {
            console.log('Creating Traefik container...');
            traefikContainer = await createContainer(traefik);
            await connectToNetwork('CF-WP', { Container: traefikContainer.id });
            await startContainer(traefikContainer.id);
        }
        progressCallback?.('traefik', 'completed', 'Traefik container ready');

        // 3. Check and handle MySQL container
        progressCallback?.('mysql', 'starting', 'Checking MySQL container...');
        console.log('Checking MySQL container...');

        const existingMySQL = await getContainerByName('mysql');

        if (existingMySQL) {
            console.log('MySQL container already exists, validating configuration...');
            const container = client.getContainer(existingMySQL.id);
            const containerInfo = await container.inspect();

            if (!validateContainerConfig(containerInfo, mysqlConfig)) {
                if (force) {
                    console.log('Invalid MySQL configuration, removing and recreating...');
                    progressCallback?.('mysql', 'starting', 'Removing invalid MySQL configuration...');
                    await removeContainer(existingMySQL.id, { force: true, v: true });
                    mysqlContainer = await createContainer(mysqlConfig);
                    await connectToNetwork('CF-WP', { Container: mysqlContainer.id });
                    await startContainer(mysqlContainer.id);
                } else {
                    const error = new Error('MySQL container exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('mysql', 'error', error.message);
                    throw error;
                }
            } else {
                console.log('MySQL container configuration is valid');
                mysqlContainer = existingMySQL;
                // Ensure it's connected to the network
                try {
                    await connectToNetwork('CF-WP', { Container: mysqlContainer.id });
                } catch (error) {
                    // Container might already be connected, ignore the error
                    console.log('Container might already be connected to network');
                }
                // Ensure it's started
                if (containerInfo.State.Status !== 'running') {
                    await startContainer(mysqlContainer.id);
                }
            }
        } else {
            console.log('Creating MySQL container...');
            mysqlContainer = await createContainer(mysqlConfig);
            await connectToNetwork('CF-WP', { Container: mysqlContainer.id });
            await startContainer(mysqlContainer.id);
        }
        progressCallback?.('mysql', 'completed', 'MySQL container ready');

        progressCallback?.('mysql-ready', 'starting', 'Waiting for MySQL to be ready...');
        console.log('Waiting for MySQL to be ready...');
        await waitForMySQLReady();
        progressCallback?.('mysql-ready', 'completed', 'MySQL is ready');

        console.log('WordPress infrastructure setup completed successfully!');
        progressCallback?.('setup', 'completed', 'WordPress infrastructure setup completed successfully!');

        // Return serializable objects only
        return {
            network: { id: network.id, name: 'CF-WP' },
            traefik: { id: traefikContainer.id, name: traefik.name || 'traefik' },
            mysql: { id: mysqlContainer.id, name: mysqlConfig.name || 'mysql' },
        };
    } catch (error) {
        console.error('Error during WordPress infrastructure setup:', error);
        progressCallback?.('setup', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
};

/**
 * Create a new WordPress container with its own database
 * @param options - WordPress setup options
 */
export const createWordPress = async (options: WordPressSetupOptions): Promise<{ id: string; name: string }> => {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    const { name, domain } = options;

    if (!name) {
        throw new Error('WordPress name is required');
    }

    console.log(`Creating WordPress container: ${name}...`);

    try {
        // Ensure MySQL tunnel is available
        try {
            await createMySQLTunnel();
        } catch (error) {
            console.error('Failed to create MySQL tunnel:', error);
            throw new Error('MySQL tunnel is required but could not be established');
        }

        // Generate database credentials
        const dbName = `wp_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const dbUser = `wp_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const dbPassword = generateRandomPassword();

        // 1. Create database and user in MySQL using the tunnel
        const mysqlConnectionOptions = getMySQLConnectionOptions();
        await createDatabaseAndUser(mysqlConnectionOptions, {
            dbName,
            dbUser,
            dbPassword,
        });

        // 2. Prepare WordPress container configuration
        const wordpressConfig: ContainerCreateOptions = {
            ...wordpress,
            name: `wordpress-${name}`,
            Env: [
                'WORDPRESS_DB_HOST=mysql:3306',
                `WORDPRESS_DB_USER=${dbUser}`,
                `WORDPRESS_DB_PASSWORD=${dbPassword}`,
                `WORDPRESS_DB_NAME=${dbName}`,
            ],
            Labels: {
                'traefik.enable': 'true',
                [`traefik.http.routers.${name}.rule`]: `Host("${domain || name + '.agence-lumia.com'}")`,
                [`traefik.http.routers.${name}.entrypoints`]: 'websecure',
                [`traefik.http.routers.${name}.tls.certresolver`]: 'letsencrypt',
                [`traefik.http.services.${name}.loadbalancer.server.port`]: '80',
            },
            HostConfig: {
                ...wordpress.HostConfig,
                Binds: [`wordpress-${name}-data:/var/www/html`],
                PortBindings: {},
            },
        };

        // 3. Create and start WordPress container
        const container = await createContainer(wordpressConfig);

        // Connect to network
        await connectToNetwork('CF-WP', { Container: container.id });
        await startContainer(container.id);

        console.log(`WordPress container '${name}' created successfully!`);
        console.log(`Database: ${dbName}`);
        console.log(`Database User: ${dbUser}`);
        console.log(`Access URL: http://${domain || name + '.agence-lumia.com'}`);

        // Return serializable object only
        return { id: container.id, name: `wordpress-${domain || name}` };
    } catch (error) {
        console.error(`Error creating WordPress container '${name}':`, error);
        throw error;
    }
};

/**
 * Create database and user for WordPress
 */
async function createDatabaseAndUser(
    connectionOptions: MySQLConnectionOptions,
    dbOptions: { dbName: string; dbUser: string; dbPassword: string }
): Promise<void> {
    const { dbName, dbUser, dbPassword } = dbOptions;

    console.log(`Creating database '${dbName}' and user '${dbUser}'...`);

    let connection;
    try {
        // Connect to MySQL
        connection = await mysql.createConnection({
            host: connectionOptions.host,
            port: connectionOptions.port,
            user: connectionOptions.user,
            password: connectionOptions.password,
        });

        // Create database
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);

        // Create user and grant privileges
        await connection.execute(
            `CREATE USER IF NOT EXISTS '${dbUser}'@'%' IDENTIFIED BY '${dbPassword}'`
        );

        await connection.execute(
            `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%'`
        );

        await connection.execute('FLUSH PRIVILEGES');

        console.log(`Database '${dbName}' and user '${dbUser}' created successfully`);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

/**
 * Generate a random password
 */
function generateRandomPassword(length: number = 16): string {
    const charset = 'SJ4Mmr5e@v6ewzRSLthZG1zJ$8PeDcM2Nru3a!pt@^*a9cHY*ZzFngcV4q%wVdeqabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

/**
 * Wait for MySQL to be ready by attempting to connect
 */
async function waitForMySQLReady(retries: number = 10, delay: number = 5000): Promise<void> {
    const mysqlConnectionOptions = getMySQLConnectionOptions();

    for (let i = 0; i < retries; i++) {
        try {
            // Try to connect to the MySQL server
            const connection = await mysql.createConnection(mysqlConnectionOptions);
            await connection.end();
            console.log('MySQL is ready');
            return;
        } catch (error) {
            console.log(`MySQL not ready yet, retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('MySQL is not ready after multiple retries');
}
