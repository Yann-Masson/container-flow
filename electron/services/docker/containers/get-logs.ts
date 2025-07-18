import docker from "../index.ts";
import { ContainerLogsOptions } from "dockerode";

/**
 * Get logs from a container
 * @param {string} containerId - The ID or name of the container
 * @param {ContainerLogsOptions} options - Options for the logs
 * @returns {Promise<string>} A promise that resolves with the logs
 */
export const getLogs = async (
        containerId: string,
        options: ContainerLogsOptions = {}
): Promise<string> => {
    try {
        const client = docker.client.getClient();
        if (!client) {
            return Promise.reject(new Error('Docker client not connected'));
        }

        const container = client.getContainer(containerId);

        // Set default options
        const logOptions: ContainerLogsOptions & { follow?: false } = {
            stdout: options.stdout !== undefined ? options.stdout : true,
            stderr: options.stderr !== undefined ? options.stderr : true,
            ...(options.tail !== undefined && { tail: options.tail }),
            since: options.since,
            until: options.until,
            timestamps: options.timestamps !== undefined ? options.timestamps : false,
        };

        // Get container logs
        const logStream = await container.logs(logOptions);

        return new Promise<string>((resolve) => {
            if (Buffer.isBuffer(logStream)) {
                resolve(logStream.toString('utf8'));
            } else {
                resolve('error');
            }
        });
    } catch (error) {
        console.error('Error getting container logs:', error);
        return Promise.reject(error);
    }
};
