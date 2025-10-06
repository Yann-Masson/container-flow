import { ipcMain } from 'electron';
import services from '../services';

export function setupDockerNetworkHandlers(log: (message: string) => void) {
    // Docker network handlers
    ipcMain.handle('docker:network:create', async (_, options) => {
        try {
            return await services.docker.network.create(options);
        } catch (error) {
            log(`Error in docker:network:create: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:network:remove', async (_, networkId, force) => {
        try {
            return await services.docker.network.remove(networkId, force);
        } catch (error) {
            log(`Error in docker:network:remove: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:network:list', async (_, options) => {
        try {
            return await services.docker.network.list(options);
        } catch (error) {
            log(`Error in docker:network:list: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:network:inspect', async (_, networkId) => {
        try {
            return await services.docker.network.inspect(networkId);
        } catch (error) {
            log(`Error in docker:network:inspect: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:network:connect', async (_, networkId, options) => {
        try {
            return await services.docker.network.connect(networkId, options);
        } catch (error) {
            log(`Error in docker:network:connect: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:network:disconnect', async (_, networkId) => {
        try {
            return await services.docker.network.disconnect(networkId);
        } catch (error) {
            log(`Error in docker:network:disconnect: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:network:prune', async () => {
        try {
            return await services.docker.network.prune();
        } catch (error) {
            log(`Error in docker:network:prune: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:network:utils:findByName', async (_, namePattern, exactMatch) => {
        try {
            return await services.docker.network.utils.findByName(namePattern, exactMatch);
        } catch (error) {
            log(`Error in docker:network:utils:findByName: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:network:utils:getContainerNetworks', async (_, containerId) => {
        try {
            return await services.docker.network.utils.getContainerNetworks(containerId);
        } catch (error) {
            log(`Error in docker:network:utils:getContainerNetworks: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:network:utils:getNetworkContainers', async (_, networkId) => {
        try {
            return await services.docker.network.utils.getNetworkContainers(networkId);
        } catch (error) {
            log(`Error in docker:network:utils:getNetworkContainers: ${error}`);
            throw error;
        }
    });
}
