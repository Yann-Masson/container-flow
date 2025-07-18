import docker from "../index.ts";

/**
 * Stop a container
 * @param {string} containerId - The ID or name of the container
 * @param {object} options - Options for stopping the container
 * @param {number} options.t - Seconds to wait before killing the container (default: 10)
 * @returns {Promise<void>} A promise that resolves when the container is stopped
 */
export const stop = async (
    containerId: string,
    options: { t?: number } = {}
): Promise<void> => {
    try {
        const client = docker.client.getClient();
        if (!client) {
            return Promise.reject(new Error('Docker client not connected'));
        }

        const container = client.getContainer(containerId);

        // Default timeout of 10 seconds if not specified
        const stopOptions = {
            t: options.t !== undefined ? options.t : 10
        };

        await container.stop(stopOptions);
        return Promise.resolve();
    } catch (error) {
        console.error('Error stopping container:', error);
        return Promise.reject(error);
    }
};
