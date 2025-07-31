import { getClient } from '../client';
import { create as createContainer } from '../containers/create';
import { start as startContainer } from '../containers/start';
import { remove as removeContainer } from '../containers/remove';
import { getByName as getContainerByName } from '../containers/get-by-name';
import createNetwork from '../network/create';
import connectToNetwork from '../network/connect';
import inspectNetwork from '../network/inspect';
import listNetworks from '../network/list';
import removeNetwork from '../network/remove';
import traefik from '../configs/traefik';
import mysqlConfig from '../configs/mysql';
import validate from "./validate";
import utils from "./utils";

// Event emitter for setup progress
type ProgressCallback = (step: string, status: 'starting' | 'completed' | 'error', message?: string) => void;

// Configuration validate interface
interface SetupOptions {
    force?: boolean;
}

/**
 * Setup the complete WordPress infrastructure
 * Creates network, Traefik and MySQL containers
 */
export default async function setup(
    options: SetupOptions = {},
    progressCallback?: ProgressCallback
): Promise<{
    network: { id: string; name: string };
    traefik: { id: string; name: string };
    mysql: { id: string; name: string };
}> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    const { force = false } = options;

    console.log('Starting WordPress infrastructure setup...');
    progressCallback?.('setup', 'starting', 'Starting WordPress infrastructure setup...');

    try {
        let network: { id: string; name?: string };
        let traefikContainer: { id: string; name?: string };
        let mysqlContainer: { id: string; name?: string };

        // 1. Check and handle network 'CF-WP'
        progressCallback?.('network', 'starting', 'Checking network CF-WP...');
        console.log('Checking network CF-WP...');

        const existingNetworks = await listNetworks({ filters: { name: ['CF-WP'] } });
        const existingNetwork = existingNetworks.find(n => n.Name === 'CF-WP');

        if (existingNetwork) {
            console.log('Network CF-WP already exists, validating configuration...');
            const networkInfo = await inspectNetwork('CF-WP');

            if (!validate.networkConfig(networkInfo)) {
                if (force) {
                    console.log('Invalid network configuration, removing and recreating...');
                    progressCallback?.('network', 'starting', 'Removing invalid network configuration...');
                    await removeNetwork('CF-WP', true);
                    network = await createNetwork({
                        Name: 'CF-WP',
                        Driver: 'bridge',
                    });
                } else {
                    const error = new Error('Network CF-WP exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('network', 'error', error.message);
                    throw error;
                }
            } else {
                console.log('Network CF-WP configuration is valid');
                network = { id: existingNetwork.Id, name: 'CF-WP' };
            }
        } else {
            console.log('Creating network CF-WP...');
            network = await createNetwork({
                Name: 'CF-WP',
                Driver: 'bridge',
            });
        }
        progressCallback?.('network', 'completed', 'Network CF-WP ready');

        // 2. Check and handle Traefik container
        progressCallback?.('traefik', 'starting', 'Checking Traefik container...');
        console.log('Checking Traefik container...');

        const existingTraefik = await getContainerByName('traefik');

        if (existingTraefik) {
            console.log('Traefik container already exists, validating configuration...');
            const container = client.getContainer(existingTraefik.id);
            const containerInfo = await container.inspect();

            if (!validate.containerConfig(containerInfo, traefik)) {
                if (force) {
                    console.log('Invalid Traefik configuration, removing and recreating...');
                    progressCallback?.('traefik', 'starting', 'Removing invalid Traefik configuration...');
                    await removeContainer(existingTraefik.id, { force: true, volume: true });
                    traefikContainer = await createContainer(traefik);
                    await connectToNetwork('CF-WP', { Container: traefikContainer.id });
                    await startContainer(traefikContainer.id);
                } else {
                    const error = new Error('Traefik container exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('traefik', 'error', error.message);
                    throw error;
                }
            } else {
                console.log('Traefik container configuration is valid');
                traefikContainer = existingTraefik;
                // Ensure it's connected to the network
                try {
                    await connectToNetwork('CF-WP', { Container: traefikContainer.id });
                } catch (error) {
                    // Container might already be connected, ignore the error
                    console.log('Container might already be connected to network');
                }
                // Ensure it's started
                if (containerInfo.State.Status !== 'running') {
                    await startContainer(traefikContainer.id);
                }
            }
        } else {
            console.log('Creating Traefik container...');
            traefikContainer = await createContainer(traefik);
            await connectToNetwork('CF-WP', { Container: traefikContainer.id });
            await startContainer(traefikContainer.id);
        }
        progressCallback?.('traefik', 'completed', 'Traefik container ready');

        // 3. Check and handle MySQL container
        progressCallback?.('mysql', 'starting', 'Checking MySQL container...');
        console.log('Checking MySQL container...');

        const existingMySQL = await getContainerByName('mysql');

        if (existingMySQL) {
            console.log('MySQL container already exists, validating configuration...');
            const container = client.getContainer(existingMySQL.id);
            const containerInfo = await container.inspect();

            if (!validate.containerConfig(containerInfo, mysqlConfig)) {
                if (force) {
                    console.log('Invalid MySQL configuration, removing and recreating...');
                    progressCallback?.('mysql', 'starting', 'Removing invalid MySQL configuration...');
                    await removeContainer(existingMySQL.id, { force: true, volume: true });
                    mysqlContainer = await createContainer(mysqlConfig);
                    await connectToNetwork('CF-WP', { Container: mysqlContainer.id });
                    await startContainer(mysqlContainer.id);
                } else {
                    const error = new Error('MySQL container exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('mysql', 'error', error.message);
                    throw error;
                }
            } else {
                console.log('MySQL container configuration is valid');
                mysqlContainer = existingMySQL;
                // Ensure it's connected to the network
                try {
                    await connectToNetwork('CF-WP', { Container: mysqlContainer.id });
                } catch (error) {
                    // Container might already be connected, ignore the error
                    console.log('Container might already be connected to network');
                }
                // Ensure it's started
                if (containerInfo.State.Status !== 'running') {
                    await startContainer(mysqlContainer.id);
                }
            }
        } else {
            console.log('Creating MySQL container...');
            mysqlContainer = await createContainer(mysqlConfig);
            await connectToNetwork('CF-WP', { Container: mysqlContainer.id });
            await startContainer(mysqlContainer.id);
        }
        progressCallback?.('mysql', 'completed', 'MySQL container ready');

        progressCallback?.('mysql-ready', 'starting', 'Waiting for MySQL to be ready...');
        console.log('Waiting for MySQL to be ready...');
        await utils.waitMysql();
        progressCallback?.('mysql-ready', 'completed', 'MySQL is ready');

        console.log('WordPress infrastructure setup completed successfully!');
        progressCallback?.('setup', 'completed', 'WordPress infrastructure setup completed successfully!');

        return {
            network: { id: network.id, name: 'CF-WP' },
            traefik: { id: traefikContainer.id, name: traefik.name || 'traefik' },
            mysql: { id: mysqlContainer.id, name: mysqlConfig.name || 'mysql' },
        };
    } catch (error) {
        console.error('Error during WordPress infrastructure setup:', error);
        progressCallback?.('setup', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
}
