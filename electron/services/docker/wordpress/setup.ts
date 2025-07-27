import { ContainerCreateOptions } from 'dockerode';
import mysql from 'mysql2/promise';
import { createMySQLTunnel, getClient, getMySQLConnectionOptions } from '../client';
import { create as createContainer } from '../containers/create';
import { start as startContainer } from '../containers/start';
import createNetwork from '../network/create';
import connectToNetwork from '../network/connect';
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

/**
 * Setup the complete WordPress infrastructure
 * Creates network, Traefik and MySQL containers
 */
export const setup = async (progressCallback?: ProgressCallback): Promise<{
    network: { id: string; name: string };
    traefik: { id: string; name: string };
    mysql: { id: string; name: string };
}> => {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    console.log('Starting WordPress infrastructure setup...');
    progressCallback?.('setup', 'starting', 'Starting WordPress infrastructure setup...');

    try {
        // 1. Create network 'CF-WP'
        progressCallback?.('network', 'starting', 'Creating network CF-WP...');
        console.log('Creating network CF-WP...');
        const network = await createNetwork({
            Name: 'CF-WP',
            Driver: 'bridge',
        });
        progressCallback?.('network', 'completed', 'Network CF-WP created successfully');

        // 2. Create and start Traefik container
        progressCallback?.('traefik', 'starting', 'Creating Traefik container...');
        console.log('Creating Traefik container...');
        const traefikContainer = await createContainer(traefik);

        // Connect to network
        await connectToNetwork('CF-WP', { Container: traefikContainer.id });
        await startContainer(traefikContainer.id);
        progressCallback?.('traefik', 'completed', 'Traefik container created and started');

        // 3. Create and start MySQL container
        progressCallback?.('mysql', 'starting', 'Creating MySQL container...');
        console.log('Creating MySQL container...');
        const mysqlContainer = await createContainer(mysqlConfig);

        // Connect to network
        await connectToNetwork('CF-WP', { Container: mysqlContainer.id });
        await startContainer(mysqlContainer.id);
        progressCallback?.('mysql', 'completed', 'MySQL container created and started');

        // Wait a bit for MySQL to be ready
        progressCallback?.('mysql-ready', 'starting', 'Waiting for MySQL to be ready...');
        console.log('Waiting for MySQL to be ready...');
        await new Promise(resolve => setTimeout(resolve, 10000));
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
