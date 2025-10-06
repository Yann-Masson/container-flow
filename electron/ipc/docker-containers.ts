import { ipcMain } from 'electron';
import services from '../services';

export function setupDockerContainersHandlers(log: (message: string) => void) {
    // Docker containers handlers
    ipcMain.handle('docker:containers:list', async () => {
        try {
            return await services.docker.containers.list();
        } catch (error) {
            log(`Error in docker:containers:list: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:containers:get', async (_, id) => {
        try {
            return await services.docker.containers.getById(id);
        } catch (error) {
            log(`Error in docker:containers:get: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:containers:create', async (_, config) => {
        try {
            const res = await services.docker.containers.create(config);
            return JSON.parse(JSON.stringify(res));
        } catch (error) {
            log(`Error in docker:containers:create: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:containers:start', async (_, id) => {
        try {
            return await services.docker.containers.start(id);
        } catch (error) {
            log(`Error in docker:containers:start: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:containers:stop', async (_, id, options) => {
        try {
            return await services.docker.containers.stop(id, options);
        } catch (error) {
            log(`Error in docker:containers:stop: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:containers:remove', async (_, id, options) => {
        try {
            return await services.docker.containers.remove(id, options);
        } catch (error) {
            log(`Error in docker:containers:remove: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:containers:getLogs', async (_, id, options, searchOptions) => {
        try {
            return await services.docker.containers.getLogs(id, options, searchOptions);
        } catch (error) {
            log(`Error in docker:containers:getLogs: ${error}`);
            throw error;
        }
    });

    // Keep old API for backward compatibility
    ipcMain.handle('docker:containers:getLogsRaw', async (_, id, options) => {
        try {
            return await services.docker.containers.getLogsRaw(id, options);
        } catch (error) {
            log(`Error in docker:containers:getLogsRaw: ${error}`);
            throw error;
        }
    });
}
