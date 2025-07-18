import docker from "../index.ts";

/**
 * Disconnect from the Docker daemon
 * @returns {Promise<void>} A promise that resolves when disconnected
 */
export const disconnect = async (): Promise<void> => {
    try {
        // Reset Docker client to null to disconnect
        if (docker.client.getClient()) {
            // Close any active connections if needed
            console.log('Disconnecting from Docker daemon');
            // Set client to null to disconnect
            docker.client.resetClient();
            return Promise.resolve();
        }
        return Promise.resolve();
    } catch (error) {
        console.error('Error disconnecting from Docker daemon:', error);
        return Promise.reject(error);
    }
};
