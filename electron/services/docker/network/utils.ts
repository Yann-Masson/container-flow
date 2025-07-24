import { getClient } from '../client';
import list from './list';
import { ContainerInspectInfo, NetworkInspectInfo } from "dockerode";

/**
 * Find networks by name pattern
 * @param namePattern - Pattern to match network names (supports partial matching)
 * @param exactMatch - Whether to use exact matching or partial matching
 * @returns Promise resolving to matching networks
 */
export async function findByName(namePattern: string, exactMatch: boolean = false): Promise<NetworkInspectInfo[]> {
    try {
        const networks = await list();

        return networks.filter(network => {
            if (exactMatch) {
                return network.Name === namePattern;
            }
            return network.Name.toLowerCase().includes(namePattern.toLowerCase());
        });
    } catch (error) {
        throw new Error(`Failed to find networks by name: ${error}`);
    }
}

/**
 * Get networks that a specific container is connected to
 * @param containerId - The ID or name of the container
 * @returns Promise resolving to networks connected to the container
 */
export async function getContainerNetworks(containerId: string): Promise<ContainerInspectInfo['NetworkSettings']['Networks']> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    try {
        const container = client.getContainer(containerId);
        const containerInfo = await container.inspect();

        return containerInfo.NetworkSettings.Networks || {};
    } catch (error) {
        throw new Error(`Failed to get container networks: ${error}`);
    }
}

/**
 * Get all containers connected to a specific network
 * @param networkId - The ID or name of the network
 * @returns Promise resolving to containers connected to the network
 */
export async function getNetworkContainers(networkId: string): Promise<NetworkInspectInfo['Containers']> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    try {
        const network = client.getNetwork(networkId);
        const networkInfo = await network.inspect();

        return networkInfo.Containers || {};
    } catch (error) {
        throw new Error(`Failed to get network containers: ${error}`);
    }
}

export default {
    findByName,
    getContainerNetworks,
    getNetworkContainers,
};
