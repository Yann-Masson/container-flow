import { state } from "../client";

/**
 * Start a container in an idempotent way.
 * Docker returns HTTP 304 ("container already started") if the container
 * is already running. Previously we propagated this as an error which caused
 * setup retries to fail. We now swallow that specific condition and treat it
 * as a successful (no-op) start so repeated setup calls are safe.
 */
export const start = async (containerId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!state.dockerClient) {
            return reject(new Error('Docker client is not connected'));
        }

        state.dockerClient.getContainer(containerId).start((err: any) => {
            if (err) {
                const msg: string = err?.message || '';
                const status: number | undefined = err?.statusCode;
                // Swallow "already started" conditions (Docker may use statusCode 304)
                if (
                    status === 304 ||
                    /304/.test(msg) ||
                    /already (started|running)/i.test(msg)
                ) {
                    console.log(`Container ${containerId} already running (ignored)`);
                    return resolve();
                }
                console.error('Error starting container:', err);
                return reject(err);
            }

            console.log('Container started:', containerId);
            resolve();
        });
    });
};
