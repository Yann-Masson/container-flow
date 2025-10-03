import type { ContainerCreateOptions, ContainerInspectInfo } from 'dockerode';
import { getClient } from '../client';
import image from '../image';
import { create as createContainer } from '../containers/create';
import { start as startContainer } from '../containers/start';
import connectToNetwork from '../network/connect';

const WORDPRESS_IMAGE = 'wordpress:latest';
const WORDPRESS_LABEL_KEY = 'container-flow.type';
const WORDPRESS_LABEL_VALUE = 'wordpress';

interface WordPressUpdateContainerResult {
    previousContainerId: string;
    container: ContainerInspectInfo;
}

const gatherNetworks = (container: ContainerInspectInfo) => {
    const networks = container.NetworkSettings?.Networks ?? {};
    return Object.entries(networks)
        .map(([name, settings]) => ({
            name,
            id: settings?.NetworkID ?? name,
            aliases: settings?.Aliases ?? undefined,
        }))
        .filter((network) => Boolean(network.id) && network.name !== 'ingress');
};

export const updateWordPressContainer = async (
    containerId: string,
): Promise<WordPressUpdateContainerResult> => {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    const container = client.getContainer(containerId);
    const inspectInfo = await container.inspect();

    if (inspectInfo.Config?.Labels?.[WORDPRESS_LABEL_KEY] !== WORDPRESS_LABEL_VALUE) {
        throw new Error('Container is not a managed WordPress instance');
    }

    const containerName = inspectInfo.Name?.replace(/^\/+/, '') ?? inspectInfo.Id;
    const wasRunning = inspectInfo.State?.Running;

    // Pull latest WordPress image to ensure we have the newest layers locally
    await image.pull(WORDPRESS_IMAGE);

    if (wasRunning) {
        try {
            await container.stop({ t: 15 });
        } catch (error) {
            throw new Error(
                `Failed to stop container ${containerName}: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        }
    }

    const networks = gatherNetworks(inspectInfo);

    try {
        await container.remove({ force: false });
    } catch (error) {
        throw new Error(
            `Failed to remove container ${containerName}: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }

    const createOptions: ContainerCreateOptions = {
        ...inspectInfo.Config,
        name: containerName,
        Image: WORDPRESS_IMAGE,
    };

    const newContainer = await createContainer(createOptions);

    for (const network of networks) {
        try {
            await connectToNetwork(network.id, {
                Container: newContainer.id,
                EndpointConfig:
                    network.aliases && network.aliases.length > 0
                        ? { Aliases: network.aliases }
                        : undefined,
            });
        } catch (error) {
            throw new Error(
                `Failed to connect updated container to network ${network.name}: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        }
    }

    if (wasRunning) {
        await startContainer(newContainer.id);
    }

    return { previousContainerId: containerId, container: await newContainer.inspect() };
};
