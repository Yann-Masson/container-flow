import { getClient } from '../client';
import { NetworkConnectOptions } from "dockerode";

/**
 * Connect a container to a network
 * @param networkId - The ID or name of the network
 * @param options - Connection options including container ID and endpoint configuration
 * @returns Promise resolving to the connection result
 */
export default async function connect(networkId: string, options: NetworkConnectOptions): Promise<void> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    try {
        const network = client.getNetwork(networkId);
        await network.connect(options);
    } catch (error) {
        throw new Error(`Failed to connect container to network: ${error}`);
    }
}
