import { Container, ContainerCreateOptions } from 'dockerode';
import { state } from "../client";
import services from "../../index.ts";

export const create = async (
        options: ContainerCreateOptions,
): Promise<Container> => {
    if (!state.dockerClient) {
        return Promise.reject(
                new Error('Docker client not connected'),
        );
    }

    try {
        // Try to create the container
        const container = await new Promise<Container>(
                (resolveCreate, rejectCreate) => {
                    state.dockerClient!.createContainer(
                            options,
                            (err, container) => {
                                if (err) {
                                    rejectCreate(err);
                                } else if (!container) {
                                    rejectCreate(
                                            new Error('Failed to create container'),
                                    );
                                } else {
                                    resolveCreate(container);
                                }
                            },
                    );
                },
        );

        console.log('Container created:', container.id);

        return container;
    } catch (_error: unknown) {
        const error = _error as Error & {
            statusCode?: number;
            reason?: string;
            message?: string;
            json?: { message?: string };
        };

        // Check if the error is related to missing image
        if (
                error.statusCode === 404 &&
                (error.reason === 'no such image' ||
                        error.message?.includes('No such image') ||
                        (error.json &&
                                error.json.message?.includes('No such image')))
        ) {
            // Extract image name from options
            const imageName = options.Image;
            if (!imageName) {
                return Promise.reject(
                        new Error('Image name not specified in options'),
                );
            }

            console.log(
                    `Image ${imageName} not found locally, attempting to pull...`,
            );

            try {
                // Pull the missing image
                await services.docker.image.pull(imageName);

                // Retry container creation after pulling the image
                const container = await new Promise<Container>(
                        (resolveRetry, rejectRetry) => {
                            state.dockerClient!.createContainer(
                                    options,
                                    (err, container) => {
                                        if (err) {
                                            console.error(
                                                    'Error creating container after pulling image:',
                                                    err,
                                            );
                                            rejectRetry(err);
                                        } else if (!container) {
                                            rejectRetry(
                                                    new Error(
                                                            'Failed to create container after pulling image',
                                                    ),
                                            );
                                        } else {
                                            resolveRetry(container);
                                        }
                                    },
                            );
                        },
                );

                console.log(
                        'Container created after pulling image:',
                        container.id,
                );

                return container;
            } catch (pullError) {
                console.error('Failed to pull image:', pullError);

            }
        } else {
            // For other errors, just reject with the original error
            console.error('Error creating container:', error);
        }

        return Promise.reject(error);
    }
};
