import { getClient } from '../client';

/**
 * Disconnect a container from a network
 * @param networkId - The ID or name of the network
 * @returns Promise resolving to the disconnection result
 */
export default async function disconnect(networkId: string): Promise<void> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    try {
        const network = client.getNetwork(networkId);
        await network.disconnect();
    } catch (error) {
        throw new Error(`Failed to disconnect container from network: ${error}`);
    }
}
