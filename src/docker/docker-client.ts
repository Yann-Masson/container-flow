import { ContainerCreateOptions } from 'dockerode';

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
        update: async (id: string, newConfig: ContainerCreateOptions, preserveVolumes?: boolean) => {
            await this.waitForElectronAPI();
            return this.electronAPI.docker.containers.update(id, newConfig, preserveVolumes);
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
}

export const dockerClientService = new DockerClientService();
