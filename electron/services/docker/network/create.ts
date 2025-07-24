import { getClient } from '../client';
import { Network, NetworkCreateOptions } from "dockerode";

/**
 * Create a new Docker network
 * @param options - Network creation options
 * @returns Promise resolving to the network creation result
 */
export default async function create(options: NetworkCreateOptions): Promise<Network> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    try {
        return await client.createNetwork(options);
    } catch (error) {
        throw new Error(`Failed to create network: ${error}`);
    }
}
