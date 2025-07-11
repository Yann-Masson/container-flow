import { ContainerCreateOptions, ContainerInfo } from 'dockerode';

interface ElectronAPI {
    docker: {
        connection: {
            connect: (
                    config: import('../../src/docker/docker-client.ts').SSHConfig,
            ) => Promise<void>;
            isConnected: () => Promise<boolean>;
            disconnect: () => Promise<void>;
        };
        containers: {
            list: () => Promise<ContainerInfo[]>;
            get: (id: string) => Promise<ContainerInfo>;
            create: (config: ContainerCreateOptions) => Promise<ContainerInfo>;
            start: (id: string) => Promise<void>;
        };
        images: {
            pull: (image: string) => Promise<void>;
        };
    };
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export {};