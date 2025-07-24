import { getClient } from '../client';

/**
 * Remove a Docker network
 * @param networkId - The ID or name of the network to remove
 * @param force - Force removal of the network (removes containers if needed)
 * @returns Promise resolving to the removal result
 */
export default async function remove(networkId: string, force: boolean = false): Promise<void> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    try {
        const network = client.getNetwork(networkId);

        if (force) {
            // First disconnect all containers if force is true
            const networkInfo = await network.inspect();
            if (networkInfo.Containers) {
                for (const containerId of Object.keys(networkInfo.Containers)) {
                    try {
                        await network.disconnect({ Container: containerId, Force: true });
                    } catch (disconnectError) {
                        console.warn(`Failed to disconnect container ${containerId}:`, disconnectError);
                    }
                }
            }
        }

        await network.remove();
    } catch (error) {
        throw new Error(`Failed to remove network: ${error}`);
    }
}
