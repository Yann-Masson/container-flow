import { ipcMain } from 'electron';
import services from '../services';

export function setupDockerImagesHandlers(log: (message: string) => void) {
    // Docker images handlers
    ipcMain.handle('docker:images:pull', async (_, image) => {
        try {
            return await services.docker.image.pull(image);
        } catch (error) {
            log(`Error in docker:images:pull: ${error}`);
            throw error;
        }
    });
}
