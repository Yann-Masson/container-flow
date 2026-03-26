import type { ContainerCreateOptions, ContainerInspectInfo } from 'dockerode';
import { getClient } from '../client';
import image from '../image';
import { create as createContainer } from '../containers/create';
import { start as startContainer } from '../containers/start';
import connectToNetwork from '../network/connect';
import { ensureWordpressPhpIni } from '../configs/php-ini';

const WORDPRESS_IMAGE = 'wordpress:latest';
const WORDPRESS_LABEL_KEY = 'container-flow.type';
const WORDPRESS_LABEL_VALUE = 'wordpress';
const WORDPRESS_PHP_INI_TARGET = '/usr/local/etc/php/conf.d/z-wordpress-custom.ini';
const WORDPRESS_CONFIG_EXTRA_VALUE =
    "define('WP_MEMORY_LIMIT','512M'); define('WP_MAX_MEMORY_LIMIT','512M'); @ini_set('max_execution_time','300');";

export interface WordPressUpdateContainerResult {
    previousContainerId: string;
    container: ContainerInspectInfo;
}

const toEnvMap = (env: string[] = []): Map<string, string> => {
    const map = new Map<string, string>();
    for (const entry of env) {
        const idx = entry.indexOf('=');
        if (idx <= 0) continue;
        map.set(entry.slice(0, idx), entry.slice(idx + 1));
    }
    return map;
};

const toEnvList = (envMap: Map<string, string>): string[] => {
    return Array.from(envMap.entries()).map(([key, value]) => `${key}=${value}`);
};

const mergeBinds = (existingBinds: string[] = [], phpIniPath: string): string[] => {
    const filtered = existingBinds.filter((bind) => !bind.includes(`:${WORDPRESS_PHP_INI_TARGET}`));
    filtered.push(`${phpIniPath}:${WORDPRESS_PHP_INI_TARGET}:ro`);
    return filtered;
};

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
    const phpIniPath = await ensureWordpressPhpIni();

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

    const envMap = toEnvMap(inspectInfo.Config?.Env ?? []);
    envMap.set('WORDPRESS_CONFIG_EXTRA', WORDPRESS_CONFIG_EXTRA_VALUE);

    const createOptions: ContainerCreateOptions = {
        ...inspectInfo.Config,
        name: containerName,
        Image: WORDPRESS_IMAGE,
        Env: toEnvList(envMap),
        HostConfig: {
            ...(inspectInfo.HostConfig ?? {}),
            Binds: mergeBinds(inspectInfo.HostConfig?.Binds ?? [], phpIniPath),
        },
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
