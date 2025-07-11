import { state } from '../client';
import { ContainerInfo } from 'dockerode';

export const list = async (): Promise<ContainerInfo[]> => {
    return new Promise((resolve, reject) => {
        if (!state.dockerClient) {
            return reject(new Error('Docker client not connected'));
        }

        state.dockerClient.listContainers({ all: true }, (err, containers) => {
            if (err) {
                console.error('Error listing containers:', err);
                return reject(err);
            }

            // If no containers are found, resolve with an empty array
            if (!containers || containers.length === 0) {
                return resolve([]);
            }

            // Resolve with the list of container information
            resolve(containers);
        });
    });
};
