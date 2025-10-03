import { Image } from 'dockerode';
import { state } from '../client';

export const get = async (imageName: string, tag: string): Promise<Image> => {
    if (!imageName) {
        throw new Error('Image name is required');
    }
    const client = state.dockerClient;

    if (!client) {
        throw new Error('Docker client not connected');
    }

    return client.getImage(`${imageName}:${tag}`);
};
