import { contextBridge, ipcRenderer } from 'electron';
import { SSHConfig } from "./services/docker/connection/try-to-connect.ts";
import { ContainerCreateOptions } from "dockerode";
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
