import { getClient } from '../client';
import { NetworkInspectInfo } from "dockerode";

/**
 * Inspect a Docker network to get detailed information
 * @param networkId - The ID or name of the network to inspect
 * @returns Promise resolving to detailed network information
 */
export default async function inspect(networkId: string): Promise<NetworkInspectInfo> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    try {
        const network = client.getNetwork(networkId);
        return await network.inspect();
    } catch (error) {
        throw new Error(`Failed to inspect network: ${error}`);
    }
}
