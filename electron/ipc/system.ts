import { ipcMain, shell } from 'electron';

export function setupSystemHandlers(log: (message: string) => void) {
    // System handlers
    ipcMain.handle('system:openExternal', async (_, url: string) => {
        try {
            await shell.openExternal(url);
            return true;
        } catch (error) {
            log(`Error opening external URL: ${error}`);
            throw error;
        }
    });
}
