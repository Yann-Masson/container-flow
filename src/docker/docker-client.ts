import { ContainerCreateOptions } from 'dockerode';

export interface SSHConfig {
    host: string;
    port: number;
    username: string;
    password: string;
}

export class DockerClientService {
    private get electronAPI() {
        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }
        return window.electronAPI;
    }

    connection = {
        isConnected: () => this.electronAPI.docker.connection.isConnected(),
        connect: (config: SSHConfig) => this.electronAPI.docker.connection.connect(config),
        disconnect: () => this.electronAPI.docker.connection.disconnect(),
    };

    containers = {
        list: () => this.electronAPI.docker.containers.list(),
        get: (id: string) => this.electronAPI.docker.containers.get(id),
        create: (config: ContainerCreateOptions) => this.electronAPI.docker.containers.create(config),
        start: (id: string) => this.electronAPI.docker.containers.start(id),
    };

    images = {
        pull: (image: string) => this.electronAPI.docker.images.pull(image),
    };
}

export const dockerClientService = new DockerClientService();
