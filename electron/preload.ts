import { contextBridge, ipcRenderer } from 'electron';
import { SSHConfig } from "./services/docker/connection/try-to-connect.ts";
import { ContainerCreateOptions } from "dockerode";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
    on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args;
        return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, ...omit] = args;
        return ipcRenderer.off(channel, ...omit);
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args;
        return ipcRenderer.send(channel, ...omit);
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args;
        return ipcRenderer.invoke(channel, ...omit);
    },

    // You can expose other APTs you need here.
    // ...
});

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
        },
        images: {
            pull: (image: string) => ipcRenderer.invoke('docker:images:pull', image),
        },
    },
});
