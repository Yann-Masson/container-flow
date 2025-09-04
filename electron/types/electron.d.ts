import {
    ContainerCreateOptions,
    ContainerInfo,
    ContainerInspectInfo,
    ContainerLogsOptions,
    Network,
    NetworkConnectOptions,
    NetworkCreateOptions,
    NetworkInspectInfo,
    NetworkListOptions,
    PruneNetworksInfo,
} from 'dockerode';

interface ElectronAPI {
    system: {
        openExternal: (url: string) => Promise<boolean>;
    };
    docker: {
        connection: {
            connect: (
                config: import('../services/docker/connection/try-to-connect.ts').SSHConfig
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
        network: {
            create: (options: NetworkCreateOptions) => Promise<Network>;
            remove: (networkId: string, force?: boolean) => Promise<void>;
            list: (options?: NetworkListOptions) => Promise<NetworkInspectInfo[]>;
            inspect: (networkId: string) => Promise<NetworkInspectInfo>;
            connect: (networkId: string, options: NetworkConnectOptions) => Promise<void>;
            disconnect: (networkId: string) => Promise<void>;
            prune: () => Promise<PruneNetworksInfo>;
            utils: {
                findByName: (namePattern: string, exactMatch?: boolean) => Promise<NetworkInspectInfo[]>;
                getContainerNetworks: (containerId: string) => Promise<ContainerInspectInfo['NetworkSettings']['Networks']>;
                getNetworkContainers: (networkId: string) => Promise<NetworkInspectInfo['Containers']>;
            };
        };
        wordpress: {
            setup: (options?: { force?: boolean }) => Promise<{
                network: { id: string; name: string };
                traefik: { id: string; name: string };
                mysql: { id: string; name: string };
            }>;
            create: (options: import('../services/docker/wordpress/create.ts').WordPressCreateOptions) => Promise<{
                id: string;
                name: string
            }>;
            clone: (sourceContainer: import('../services/docker/connection/try-to-connect.ts').ContainerInspectInfo) => Promise<ContainerInspectInfo>;
            onSetupProgress: (callback: (event: {
                step: string;
                status: 'starting' | 'success' | 'error';
                message?: string
            }) => void) => () => void;
            changeUrl: (container: ContainerInspectInfo, newUrl: string) => Promise<ContainerInspectInfo>;
            delete: (options: import('../services/docker/wordpress/delete.ts').WordPressDeleteOptions) => Promise<void>;
        };
    };
    storage: {
        app: {
            get: () => Promise<import('../services/storage/app/app.type.ts').AppSavedConfig>;
            save: (appConfig: import('../services/storage/app/app.type.ts').AppSavedConfig) => Promise<void>;
        };
        ssh: {
            get: () => Promise<import('../services/storage/ssh/ssh.type.ts').SSHSavedConfig>;
            save: (sshConfig: import('../services/storage/ssh/ssh.type.ts').SSHSavedConfig) => Promise<void>;
        };
    };
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export {};