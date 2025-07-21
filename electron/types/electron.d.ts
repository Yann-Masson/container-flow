import { ContainerCreateOptions, ContainerInfo, ContainerInspectInfo, ContainerLogsOptions } from 'dockerode';

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
            get: (id: string) => Promise<ContainerInspectInfo>;
            create: (config: ContainerCreateOptions) => Promise<Container>;
            start: (id: string) => Promise<void>;
            stop: (id: string, options?: { t?: number }) => Promise<void>;
            remove: (id: string, options?: { v?: boolean; force?: boolean }) => Promise<void>;
            getLogs: (
                id: string,
                options?: ContainerLogsOptions
            ) => Promise<string>;
        };
        images: {
            pull: (image: string) => Promise<void>;
        };
    };
    preferences: {
        ssh: {
            get: () => Promise<{ host: string; port: string; username: string }>;
            save: (sshPreferences: { host: string; port: string; username: string }) => Promise<void>;
        };
    };
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export {};