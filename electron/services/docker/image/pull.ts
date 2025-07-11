import { state } from "../client";

export const pull = async (imageName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!state.dockerClient) {
            return reject(new Error('Docker client not connected'));
        }

        console.log(`Pulling image: ${imageName}`);
        // @ts-expect-error-next-line
        state.dockerClient.pull(imageName, (err, stream) => {
            if (err) {
                console.error('Error pulling image:', err);
                return reject(err);
            }

            if (!state.dockerClient) {
                return reject(new Error('Docker client not connected'));
            }

            state.dockerClient.modem.followProgress(
                    stream,
                    (err: unknown) => {
                        if (err) {
                            console.error('Error during image pull:', err);
                            return reject(err);
                        }
                        console.log(`Image ${imageName} pulled successfully`);
                        resolve();
                    },
            );
        });
    });
};
