import Docker from 'dockerode';
import { state } from '../client';

export const getByName = async (
    name: string,
): Promise<{ id: string; info: Docker.ContainerInfo } | null> => {
    return new Promise((resolve, reject) => {
        if (!state.dockerClient) {
            return reject(new Error('Docker client not connected'));
        }

        state.dockerClient.listContainers({ all: true }, (err, containers) => {
            if (err) {
                console.error('Error listing containers:', err);
                return reject(err);
            }

            // Names in Docker API come with a leading slash, so we need to handle that
            const container = containers?.find((c) =>
                c.Names.some((n) => n === `/${name}` || n === name),
            );

            if (container) {
                resolve({ id: container.Id, info: container });
            } else {
                resolve(null);
            }
        });
    });
};
