import { ContainerCreateOptions } from 'dockerode';
import { createMySQLTunnel, getClient, getMySQLConnectionOptions } from '../client';
import { create as createContainer } from '../containers/create';
import { start as startContainer } from '../containers/start';
import connectToNetwork from '../network/connect';
import wordpress from '../configs/wordpress';
import utils from "./utils";

export interface WordPressCreateOptions {
    name: string;
    domain?: string;
}

/**
 * Create a new WordPress container with its own database
 * @param options - WordPress setup options
 */
export default async function create(options: WordPressCreateOptions): Promise<{ id: string; name: string }> {
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
        const dbPassword = utils.generateRandomPassword();

        // 1. Create database and user in MySQL using the tunnel
        const mysqlConnectionOptions = getMySQLConnectionOptions();
        await utils.createDatabaseWithUser(mysqlConnectionOptions, {
            dbName,
            dbUser,
            dbPassword,
        });

        // Wait a bit to ensure MySQL has fully processed the user creation
        console.log('Waiting for MySQL to process user creation...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Prepare WordPress container configuration
        const wordpressConfig: ContainerCreateOptions = {
            ...wordpress,
            name: `wordpress-${name}-1`,
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
                'container-flow.name': `${name}`,
                'container-flow.type': 'wordpress',
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
}
