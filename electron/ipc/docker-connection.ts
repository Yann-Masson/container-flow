import { ipcMain } from 'electron';
import services from '../services';

export function setupDockerConnectionHandlers(log: (message: string) => void) {
    // Docker connection handlers
    ipcMain.handle('docker:connection:connect', async (_, config) => {
        try {
            return await services.docker.connection.tryToConnect(config);
        } catch (error) {
            log(`Error in docker:connection:connect: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:connection:isConnected', async () => {
        try {
            return services.docker.connection.isConnected();
        } catch (error) {
            log(`Error in docker:connection:isConnected: ${error}`);
            throw error;
        }
    });

    ipcMain.handle('docker:connection:disconnect', async () => {
        try {
            return await services.docker.connection.disconnect();
        } catch (error) {
            log(`Error in docker:connection:disconnect: ${error}`);
            throw error;
        }
    });
}
