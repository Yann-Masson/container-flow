import { ContainerCreateOptions, ContainerInspectInfo } from 'dockerode';
import { getClient } from '../client';
import { create as createContainer } from '../containers/create';
import { start as startContainer } from '../containers/start';
import connectToNetwork from '../network/connect';
import wordpress from '../configs/wordpress';
import { getById } from "../containers/get-by-id.ts";

/**
 * Clone an existing WordPress container with the same database and configuration
 * @param sourceContainer - The container to clone from
 */
export default async function clone(
    sourceContainer: ContainerInspectInfo,
): Promise<ContainerInspectInfo> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    console.log(`Cloning WordPress container from: ${sourceContainer.Name}...`);

    try {
        // Extract configuration from source container
        const sourceEnv = sourceContainer.Config.Env || [];
        const sourceLabels = sourceContainer.Config.Labels || {};

        const sourceName = sourceContainer.Name.replace('wordpress-', '').replace(/-\d+$/, '');
        const sourceHostConfig = sourceContainer.HostConfig || {
            ...wordpress.HostConfig,
            // Use the same volume as the source container to share files
            Binds: [`wordpress-${sourceName}-data:/var/www/html`],
            PortBindings: {},
        };

        const match = sourceContainer.Name.match(/^(.*?)-(\d+)$/);
        const baseName = match ? match[1] : sourceContainer.Name;
        const currentNumber = match ? parseInt(match[2], 10) : 1;
        const name = `${baseName}-${currentNumber + 1}`;

        if (!sourceEnv.some(env => env.startsWith('WORDPRESS_DB_NAME='))) {
            throw new Error('Source container does not have a valid WordPress database configuration');
        }
        if (!sourceLabels['traefik.http.routers.' + sourceName + '.rule']) {
            throw new Error('Source container does not have a valid Traefik rule');
        }
        if (!sourceHostConfig.Binds || !sourceHostConfig.Binds.some(bind => bind.startsWith('wordpress-'))) {
            throw new Error('Source container does not have a valid volume bind');
        }

        // Prepare cloned WordPress container configuration
        const clonedConfig: ContainerCreateOptions = {
            ...wordpress,
            name,
            Env: sourceEnv,
            Labels: sourceLabels,
            HostConfig: sourceHostConfig,
        };

        // Create and start cloned WordPress container
        const container = await createContainer(clonedConfig);

        // Connect to network
        await connectToNetwork('CF-WP', { Container: container.id });
        await startContainer(container.id);

        console.log(`WordPress container '${name}' cloned successfully from '${sourceContainer.Name}'!`);
        console.log(`Shared Database: ${sourceContainer.Config.Env?.find(env => env.startsWith('WORDPRESS_DB_NAME='))?.split('=')[1] || 'unknown'}`);
        console.log(`Shared Volume: wordpress-${sourceName}-data`);
        console.log(`Access URL: https://${sourceContainer.Config.Labels?.['traefik.http.routers.' + sourceName + '.rule']?.replace('Host("', '').replace('")', '') || name + '.agence-lumia.com'}`);

        return await getById(container.id);
    } catch (error) {
        console.error(`Error cloning WordPress container:`, error);
        throw error;
    }
}
