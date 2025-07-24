import { ContainerCreateOptions, NetworkConnectOptions, NetworkCreateOptions, NetworkListOptions } from 'dockerode';

export interface SSHConfig {
    host: string;
    port: number;
    username: string;
    password: string;
}

export class DockerClientService {
    private get electronAPI() {
        if (typeof window === 'undefined') {
            throw new Error('Electron API not available: window is undefined');
        }
        if (!window.electronAPI) {
            throw new Error('Electron API not available: electronAPI not found on window');
        }
        return window.electronAPI;
    }

    private async waitForElectronAPI(timeout = 5000): Promise<void> {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (typeof window !== 'undefined' && window.electronAPI) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('Electron API not available after timeout');
    }

    connection = {
        isConnected: async () => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.connection.isConnected();
        },
        connect: async (config: SSHConfig) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.connection.connect(config);
        },
        disconnect: async () => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.connection.disconnect();
        },
    };

    containers = {
        list: async () => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.containers.list();
        },
        get: async (id: string) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.containers.get(id);
        },
        create: async (config: ContainerCreateOptions) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.containers.create(config);
        },
        start: async (id: string) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.containers.start(id);
        },
        stop: async (id: string, options?: { t?: number }) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.containers.stop(id, options);
        },
        remove: async (id: string, options?: { v?: boolean; force?: boolean }) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.containers.remove(id, options);
        },
        getLogs: async (id: string, options?: { follow?: boolean; stdout?: boolean; stderr?: boolean }) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.containers.getLogs(id, options);
        },
    };

    images = {
        pull: async (image: string) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.images.pull(image);
        },
    };

    network = {
        create: async (options: NetworkCreateOptions) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.network.create(options);
        },
        remove: async (networkId: string, force?: boolean) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.network.remove(networkId, force);
        },
        list: async (options?: NetworkListOptions) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.network.list(options);
        },
        inspect: async (networkId: string) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.network.inspect(networkId);
        },
        connect: async (networkId: string, options: NetworkConnectOptions) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.network.connect(networkId, options);
        },
        disconnect: async (networkId: string) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.network.disconnect(networkId);
        },
        prune: async () => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.network.prune();
        },
        utils: {
            findByName: async (namePattern: string, exactMatch?: boolean) => {
                await this.waitForElectronAPI();
                return this.electronAPI.docker.network.utils.findByName(namePattern, exactMatch);
            },
            getContainerNetworks: async (containerId: string) => {
                await this.waitForElectronAPI();
                return this.electronAPI.docker.network.utils.getContainerNetworks(containerId);
            },
            getNetworkContainers: async (networkId: string) => {
                await this.waitForElectronAPI();
                return this.electronAPI.docker.network.utils.getNetworkContainers(networkId);
            },
        },
    };
}

export const dockerClientService = new DockerClientService();
