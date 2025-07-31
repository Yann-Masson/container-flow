import { contextBridge, ipcRenderer } from 'electron';
import { SSHConfig } from "./services/docker/connection/try-to-connect.ts";
import {
    ContainerCreateOptions,
    ContainerInspectInfo,
    ContainerLogsOptions,
    NetworkConnectOptions,
    NetworkCreateOptions,
    NetworkListOptions
} from "dockerode";
import { AppSavedConfig } from "./services/storage/app/app.type.ts";
import { SSHSavedConfig } from "./services/storage/ssh/ssh.type.ts";
import { WordPressDeleteOptions } from "./services/docker/wordpress/delete.ts";
import { WordPressCreateOptions } from "./services/docker/wordpress/create.ts";

// Expose Docker API
contextBridge.exposeInMainWorld('electronAPI', {
    system: {
        openExternal: (url: string) => ipcRenderer.invoke('system:openExternal', url),
    },
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
        wordpress: {
            setup: (options?: { force?: boolean }) => ipcRenderer.invoke('docker:wordpress:setup', options),
            create: (options: WordPressCreateOptions) =>
                ipcRenderer.invoke('docker:wordpress:create', options),
            clone: (sourceContainer: ContainerInspectInfo) =>
                ipcRenderer.invoke('docker:wordpress:clone', sourceContainer),
            onSetupProgress: (callback: (event: { step: string; status: string; message?: string }) => void) => {
                const handleProgress = (_: any, event: { step: string; status: string; message?: string }) => {
                    callback(event);
                };
                ipcRenderer.on('wordpress:setup:progress', handleProgress);
                return () => ipcRenderer.removeListener('wordpress:setup:progress', handleProgress);
            },
            changeUrl: (container: ContainerInspectInfo, newUrl: string) =>
                ipcRenderer.invoke('docker:wordpress:changeUrl', container, newUrl),
            'delete': (options: WordPressDeleteOptions) => ipcRenderer.invoke('docker:wordpress:delete', options),
        },
    },
    storage: {
        app: {
            get: () => ipcRenderer.invoke('storage:app:get'),
            save: (appConfig: AppSavedConfig) =>
                ipcRenderer.invoke('storage:app:save', appConfig),
        },
        ssh: {
            get: () => ipcRenderer.invoke('storage:ssh:get'),
            save: (sshConfig: SSHSavedConfig) =>
                ipcRenderer.invoke('storage:ssh:save', sshConfig),
        },
    },
});
