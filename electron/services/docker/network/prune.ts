import { getClient } from '../client';
import { PruneNetworksInfo } from "dockerode";

/**
 * Remove unused networks (prune)
 * @returns Promise resolving to the pruning result
 */
export default async function prune(): Promise<PruneNetworksInfo> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    try {
        return await client.pruneNetworks();
    } catch (error) {
        throw new Error(`Failed to prune networks: ${error}`);
    }
}
