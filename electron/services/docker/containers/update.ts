import { ContainerCreateOptions, ContainerInspectInfo } from 'dockerode';
import { remove } from './remove';
import { stop } from './stop';
import { create } from './create';
import { start } from './start';
import { getById } from './get-by-id';
import docker from "../index.ts";

/**
 * Update a container by recreating it with new configuration
 * @param {string} containerId - The ID or name of the container to update
 * @param {object} newConfig - The new container configuration
 * @param {boolean} preserveVolumes - Whether to preserve the volumes (default: true)
 * @returns {Promise<ContainerInspectInfo>} A promise that resolves with information about the new container
 */
export const update = async (
    containerId: string,
    newConfig: ContainerCreateOptions,
    preserveVolumes: boolean = true
): Promise<ContainerInspectInfo> => {
    try {
        const client = docker.client.getClient();
        if (!client) {
            return Promise.reject(new Error('Docker client not connected'));
        }

        // Get current container info to preserve some settings if needed
        const originalContainer = await getById(containerId);

        // Preserve volumes if requested
        const volumes = preserveVolumes ? originalContainer.Mounts : [];

        // Check if container is running
        const isRunning = originalContainer.State.Running;

        // Stop the container if it's running
        if (isRunning) {
            await stop(containerId);
        }

        // Remove the old container but keep volumes
        await remove(containerId, { v: !preserveVolumes });

        // Prepare config for new container
        // Merge original settings with new config
        const mergedConfig = {
            ...newConfig,
            name: originalContainer.Name.replace(/^\//, ''), // Remove leading slash if present
        };

        // Add volume configurations if preserving volumes
        if (preserveVolumes && volumes.length > 0) {
            mergedConfig.HostConfig = mergedConfig.HostConfig || {};
            mergedConfig.HostConfig.Binds = volumes
                .filter(mount => mount.Type === 'bind' || mount.Type === 'volume')
                .map(mount => {
                    if (mount.Type === 'bind') {
                        return `${mount.Source}:${mount.Destination}:${mount.Mode}`;
                    } else {
                        return `${mount.Name}:${mount.Destination}:${mount.Mode}`;
                    }
                });
        }

        // Create a new container with updated config
        const newContainer = await create(mergedConfig);

        // Start the new container if the original was running
        if (isRunning) {
            await start(newContainer.id);
        }

        return getById(newContainer.id);
    } catch (error) {
        console.error('Error updating container:', error);
        return Promise.reject(error);
    }
};
