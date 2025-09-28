import { createMySQLTunnel, getClient, getMySQLConnectionOptions } from '../client';
import { list as listContainers } from '../containers/list';
import { stop as stopContainer } from '../containers/stop';
import { remove as removeContainer } from '../containers/remove';
import utils from "./utils";

export interface WordPressDeleteOptions {
    name: string;
}

/**
 * Delete a WordPress installation completely
 * This will:
 * 1. Stop and remove all containers with the 'container-flow.name' label matching the WordPress name
 * 2. Remove associated volumes
 * 3. Delete the database and user from MySQL
 *
 * @param options - WordPress delete options
 */
export default async function deleteWordPress(options: WordPressDeleteOptions): Promise<void> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    const { name } = options;

    if (!name) {
        throw new Error('WordPress name is required');
    }

    console.log(`Deleting WordPress installation: ${name}...`);

    try {
        // 1. Find all containers with the container-flow.name label
        const containers = await listContainers();
        const wordpressContainers = containers.filter(container => {
            const labels = container.Labels || {};
            return labels['container-flow.name'] === name;
        });

        console.log(`Found ${wordpressContainers.length} containers to delete for WordPress '${name}'`);

        // 2. Stop and remove each container
        for (const container of wordpressContainers) {
            try {
                console.log(`Stopping container: ${container.Names?.[0] || container.Id}`);

                // Stop the container if it's running
                if (container.State === 'running') {
                    await stopContainer(container.Id, { t: 10 });
                    console.log(`Container stopped: ${container.Names?.[0] || container.Id}`);
                }

                // Remove the container and its volumes
                await removeContainer(container.Id, {
                    volume: true,  // Remove volumes
                    force: true  // Force removal
                });
                console.log(`Container removed: ${container.Names?.[0] || container.Id}`);

            } catch (error) {
                console.error(`Error removing container ${container.Id}:`, error);
                // Continue with other containers even if one fails
            }
        }

        // 3. Remove any additional named volumes that might be associated
        try {
            const volumeName = `wp-${name.replace(/[^a-zA-Z0-9]/g, '-')}-data`;
            const volume = client.getVolume(volumeName);
            await volume.remove({ force: true });
            console.log(`Volume removed: ${volumeName}`);
        } catch (error) {
            // Volume might not exist, which is fine
            console.log(`Volume removal warning (might not exist): ${error}`);
        }

        // 4. Delete database and user from MySQL
        try {
            // Ensure MySQL tunnel is available
            await createMySQLTunnel();

            const dbName = `wp_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const dbUser = `wp_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;

            const mysqlConnectionOptions = getMySQLConnectionOptions();
            await utils.deleteDatabaseAndUser(mysqlConnectionOptions, {
                dbName,
                dbUser
            });

            console.log(`Database and user deleted: ${dbName}, ${dbUser}`);
        } catch (error) {
            console.error('Error deleting database:', error);
            // Don't throw here as containers are already deleted
        }

        console.log(`WordPress installation '${name}' has been completely deleted`);

    } catch (error) {
        console.error(`Error deleting WordPress installation '${name}':`, error);
        throw error;
    }
}
