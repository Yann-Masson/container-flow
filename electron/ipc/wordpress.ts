import { ipcMain, BrowserWindow } from 'electron';
import services from '../services';

export function setupWordPressHandlers(
    log: (message: string) => void,
    getWin: () => BrowserWindow | null,
) {
    // WordPress handlers
    ipcMain.handle('docker:wordpress:setup', async (_, options) => {
        try {
            const win = getWin();
            const success = await services.docker.wordpress.setup(
                options,
                (step, status, message) => {
                    win?.webContents.send('wordpress:setup:progress', {
                        step,
                        status,
                        message,
                    });
                },
            );
            return { success };
        } catch (error) {
            log(`Error in docker:wordpress:setup: ${error}`);
            // Also emit an error progress event for UI clarity
            const win = getWin();
            win?.webContents.send('wordpress:setup:progress', {
                step: 'setup',
                status: 'error',
                message: (error as Error).message,
            });
            return { success: false };
        }
    });

    ipcMain.handle('docker:wordpress:create', async (_, options) => {
        try {
            return await services.docker.wordpress.create(options);
        } catch (error) {
            log(`Error in docker:wordpress:create: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:wordpress:clone', async (_, sourceContainer) => {
        try {
            return await services.docker.wordpress.clone(sourceContainer);
        } catch (error) {
            log(`Error in docker:wordpress:clone: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:wordpress:changeUrl', async (_, container, newUrl) => {
        try {
            return await services.docker.wordpress.changeUrl(container, newUrl);
        } catch (error) {
            log(`Error in docker:wordpress:changeUrl: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:wordpress:checkUpdates', async () => {
        try {
            return await services.docker.wordpress.checkUpdates();
        } catch (error) {
            log(`Error in docker:wordpress:checkUpdates: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:wordpress:update', async (_, containerId: string) => {
        try {
            return await services.docker.wordpress.update(containerId);
        } catch (error) {
            log(`Error in docker:wordpress:update: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:wordpress:delete', async (_, options) => {
        try {
            return await services.docker.wordpress.delete(options);
        } catch (error) {
            log(`Error in docker:wordpress:delete: ${error}`);
            throw error;
        }
    });
}
