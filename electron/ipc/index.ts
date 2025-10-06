import { BrowserWindow } from 'electron';
import { setupDockerConnectionHandlers } from './docker-connection';
import { setupDockerContainersHandlers } from './docker-containers';
import { setupDockerImagesHandlers } from './docker-images';
import { setupDockerNetworkHandlers } from './docker-network';
import { setupWordPressHandlers } from './wordpress';
import { setupStorageHandlers } from './storage';
import { setupSystemHandlers } from './system';
import { setupRuntimePasswordsHandlers } from './runtime-passwords';

export function setupAllIpcHandlers(log: (message: string) => void, getWin: () => BrowserWindow | null) {
    try {
        setupDockerConnectionHandlers(log);
        setupDockerContainersHandlers(log);
        setupDockerImagesHandlers(log);
        setupDockerNetworkHandlers(log);
        setupWordPressHandlers(log, getWin);
        setupStorageHandlers(log);
        setupSystemHandlers(log);
        setupRuntimePasswordsHandlers(log);

        log('All IPC handlers registered successfully');
    } catch (error) {
        log(`Error setting up IPC handlers: ${error}`);
        throw error;
    }
}
