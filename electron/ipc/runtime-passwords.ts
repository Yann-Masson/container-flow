import { ipcMain } from 'electron';
import passwordManager from '../services/runtime/passwords';

export function setupRuntimePasswordsHandlers(log: (message: string) => void) {
    // Password manager (runtime-only) handlers
    ipcMain.handle('runtime:passwords:discover', async () => {
        try {
            return await passwordManager.discoverFromContainers();
        } catch (error) {
            log(`Error in runtime:passwords:discover: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('runtime:passwords:getState', async () => {
        try {
            return passwordManager.getState();
        } catch (error) {
            log(`Error in runtime:passwords:getState: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('runtime:passwords:status', async () => {
        try {
            return passwordManager.status();
        } catch (error) {
            log(`Error in runtime:passwords:status: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('runtime:passwords:setRootAndMetrics', async (_, _opts) => {
        try {
            passwordManager.setRootAndMetrics(_opts);
            return passwordManager.status();
        } catch (error) {
            log(`Error in runtime:passwords:setRootAndMetrics: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('runtime:passwords:registerProject', async (_, { projectName, creds }) => {
        try {
            passwordManager.registerProject(projectName, creds);
            return true;
        } catch (error) {
            log(`Error in runtime:passwords:registerProject: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('runtime:passwords:reset', async () => {
        try {
            passwordManager.reset();
            return true;
        } catch (error) {
            log(`Error in runtime:passwords:reset: ${error}`);
            throw error;
        }
    });
}
