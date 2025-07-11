import { state } from "../client";

export const start = async (containerId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!state.dockerClient) {
            return reject(new Error('Docker client is not connected'));
        }

        state.dockerClient.getContainer(containerId).start((err) => {
            if (err) {
                console.error('Error starting container:', err);
                return reject(err);
            }

            console.log('Container started:', containerId);
            resolve();
        });
    });
};
