import { state } from '../client';
import { ContainerInspectInfo } from 'dockerode';

export const getById = async (
        containerId: string,
): Promise<ContainerInspectInfo> => {
    return new Promise((_resolve, reject) => {
        if (!state.dockerClient) {
            return reject(new Error('Docker client not connected'));
        }

        return state.dockerClient.getContainer(containerId).inspect((err, data) => {
            if (err || !data) {
                console.error('Error getting container by ID:', err);
                return reject(err);
            }

            console.log('Container data retrieved:', data);
            _resolve(data);
        });
    });
};
