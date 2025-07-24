import { contextBridge, ipcRenderer } from 'electron';
import { SSHConfig } from "./services/docker/connection/try-to-connect.ts";
import {
    ContainerCreateOptions,
    ContainerLogsOptions,
    NetworkConnectOptions,
    NetworkCreateOptions,
    NetworkListOptions
} from "dockerode";

// Expose Docker API
contextBridge.exposeInMainWorld('electronAPI', {
    docker: {
        connection: {
            connect: (config: SSHConfig) => ipcRenderer.invoke('docker:connection:connect', config),
            isConnected: () => ipcRenderer.invoke('docker:connection:isConnected'),
            disconnect: () => ipcRenderer.invoke('docker:connection:disconnect'),
        },
        containers: {
            list: () => ipcRenderer.invoke('docker:containers:list'),
            get: (id: string) => ipcRenderer.invoke('docker:containers:get', id),
            create: (config: ContainerCreateOptions) => ipcRenderer.invoke('docker:containers:create', config),
            start: (id: string) => ipcRenderer.invoke('docker:containers:start', id),
            stop: (id: string, options?: { t?: number }) =>
                ipcRenderer.invoke('docker:containers:stop', id, options),
            remove: (id: string, options?: { v?: boolean; force?: boolean }) =>
                ipcRenderer.invoke('docker:containers:remove', id, options),
            getLogs: (id: string, options?: ContainerLogsOptions) =>
                ipcRenderer.invoke('docker:containers:getLogs', id, options),
        },
        images: {
            pull: (image: string) => ipcRenderer.invoke('docker:images:pull', image),
        },
        network: {
            create: (options: NetworkCreateOptions) =>
                ipcRenderer.invoke('docker:network:create', options),
            remove: (networkId: string, force?: boolean) =>
                ipcRenderer.invoke('docker:network:remove', networkId, force),
            list: (options?: NetworkListOptions) =>
                ipcRenderer.invoke('docker:network:list', options),
            inspect: (networkId: string) =>
                ipcRenderer.invoke('docker:network:inspect', networkId),
            connect: (networkId: string, options: NetworkConnectOptions) =>
                ipcRenderer.invoke('docker:network:connect', networkId, options),
            disconnect: (networkId: string) =>
                ipcRenderer.invoke('docker:network:disconnect', networkId),
            prune: () =>
                ipcRenderer.invoke('docker:network:prune'),
            utils: {
                findByName: (namePattern: string, exactMatch?: boolean) =>
                    ipcRenderer.invoke('docker:network:utils:findByName', namePattern, exactMatch),
                getContainerNetworks: (containerId: string) =>
                    ipcRenderer.invoke('docker:network:utils:getContainerNetworks', containerId),
                getNetworkContainers: (networkId: string) =>
                    ipcRenderer.invoke('docker:network:utils:getNetworkContainers', networkId),
            },
        },
    },
    preferences: {
        ssh: {
            get: () => ipcRenderer.invoke('preferences:ssh:get'),
            save: (sshPreferences: { host: string; port: string; username: string }) =>
                ipcRenderer.invoke('preferences:ssh:save', sshPreferences),
        },
    },
});
