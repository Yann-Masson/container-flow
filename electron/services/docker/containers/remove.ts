import docker from "../index.ts";

/**
 * Remove a container
 * @param {string} containerId - The ID or name of the container
 * @param {object} options - Options for removing the container
 * @param {boolean} options.v - Remove volumes associated with the container (default: false)
 * @param {boolean} options.force - Force removal of the container (default: false)
 * @returns {Promise<void>} A promise that resolves when the container is removed
 */
export const remove = async (
    containerId: string,
    options: {
        v?: boolean;
        force?: boolean;
    } = {}
): Promise<void> => {
    try {
        const client = docker.client.getClient();
        if (!client) {
            return Promise.reject(new Error('Docker client not connected'));
        }

        const container = client.getContainer(containerId);

        // Set default options
        const removeOptions = {
            v: options.v !== undefined ? options.v : false,
            force: options.force !== undefined ? options.force : false
        };

        await container.remove(removeOptions);
        return Promise.resolve();
    } catch (error) {
        console.error('Error removing container:', error);
        return Promise.reject(error);
    }
};
