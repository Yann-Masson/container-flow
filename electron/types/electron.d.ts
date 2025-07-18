import { ContainerCreateOptions, ContainerInfo, ContainerLogsOptions } from 'dockerode';

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
            stop: (id: string, options?: { t?: number }) => Promise<void>;
            remove: (id: string, options?: { v?: boolean; force?: boolean }) => Promise<void>;
            update: (id: string, newConfig: ContainerCreateOptions, preserveVolumes?: boolean) => Promise<ContainerInspectInfo>;
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