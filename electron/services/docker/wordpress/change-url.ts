import { ContainerCreateOptions, ContainerInspectInfo } from "dockerode";
import docker from "../index.ts";
import wordpress from "../configs/wordpress.ts";

export default async function changeUrl(container: ContainerInspectInfo, newUrl: string): Promise<ContainerInspectInfo> {
    // Extract configuration from existing container
    const config = container.Config;

    // Create new Traefik labels with new URL
    const newLabels = { ...config.Labels };

    // Update all Traefik router rules to use new URL
    Object.keys(newLabels).forEach(key => {
        if (key.includes('.rule') && newLabels[key].includes('Host(')) {
            newLabels[key] = `Host("${newUrl}")`;
        }
    });

    // Prepare new container configuration
    const newContainerConfig: ContainerCreateOptions = {
        ...wordpress,
        name: container.Name,
        Env: config.Env,
        Labels: newLabels,
        HostConfig: container.HostConfig,
    };

    // Stop the existing container
    if (container.State.Status === 'running') {
        await docker.containers.stop(container.Id);
    }

    await docker.containers.remove(container.Id, { force: true });

    const newContainer = await docker.containers.create(newContainerConfig);

    // Connect to the CF-WP network
    try {
        await docker.network.connect('CF-WP', { Container: newContainer.id });
    } catch (error) {
        console.warn('Network connection might already exist:', error);
    }

    // Start the new container
    await docker.containers.start(newContainer.id);

    return await docker.containers.getById(newContainer.id);
}