import { getClient } from '../client';
import { NetworkInspectInfo, NetworkListOptions } from "dockerode";

/**
 * List all Docker networks
 * @param options - Filtering options for listing networks
 * @returns Promise resolving to an array of networks
 */
export default async function list(options?: NetworkListOptions): Promise<NetworkInspectInfo[]> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    try {
        return await client.listNetworks(options);
    } catch (error) {
        throw new Error(`Failed to list networks: ${error}`);
    }
}
