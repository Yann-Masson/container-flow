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
            createWordPress: (options: { name: string; domain?: string }) => Promise<{ id: string; name: string }>;
            onSetupProgress: (callback: (event: {
                step: string;
                status: 'starting' | 'completed' | 'error';
                message?: string
            }) => void) => () => void;
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