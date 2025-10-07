import { ipcMain } from 'electron';
import services from '../services';

export function setupStorageHandlers(log: (message: string) => void) {
    // Storage handlers
    ipcMain.handle('storage:app:get', async () => {
        try {
            return services.storage.app.get();
        } catch (error) {
            log(`Error in storage:app:get: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('storage:app:save', async (_, appConfig) => {
        try {
            return services.storage.app.save(appConfig);
        } catch (error) {
            log(`Error in storage:app:save: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('storage:ssh:get', async () => {
        try {
            return services.storage.ssh.get();
        } catch (error) {
            log(`Error in storage:ssh:get: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('storage:ssh:save', async (_, sshConfig) => {
        try {
            return services.storage.ssh.save(sshConfig);
        } catch (error) {
            log(`Error in storage:ssh:save: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('storage:app:clear', async () => {
        try {
            return services.storage.app.clear();
        } catch (error) {
            log(`Error in storage:app:clear: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('storage:ssh:clear', async () => {
        try {
            return services.storage.ssh.clear();
        } catch (error) {
            log(`Error in storage:ssh:clear: ${error}`);
            throw error;
        }
    });
}
