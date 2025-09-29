import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import electronUpdater, { type AppUpdater } from 'electron-updater';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import services from './services';
import passwordManager from './services/runtime/passwords';

// import { createRequire } from 'node:module'*
const __dirname = import.meta.dirname || path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
// export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? process.env.APP_ROOT : RENDERER_DIST;

let win: BrowserWindow | null;

// Logs setup
const logPath = path.join(app.getPath('userData'), 'updater.log');

function log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    console.log(message);

    try {
        fs.appendFileSync(logPath, logMessage);
    } catch (error) {
        console.error('Error writing log:', error);
    }
}

function createWindow() {
    // On macOS the app bundle icon (from .icns) is used automatically; specifying a PNG path that
    // isn't packaged (previously) caused a fallback to the default electron icon. We now only
    // set an explicit icon on non-mac platforms.
    const windowOptions: Electron.BrowserWindowConstructorOptions = {
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    };
    if (process.platform !== 'darwin') {
        windowOptions.icon = path.join(
            process.env.APP_ROOT!,
            'assets/icons/container-flow-1024.png',
        );
    }
    win = new BrowserWindow(windowOptions);

    // Create a menu for accessing logs
    // const menu = Menu.buildFromTemplate([
    //     {
    //         label: 'Debug',
    //         submenu: [
    //             {
    //                 label: 'Open log file',
    //                 click: () => {
    //                     shell.showItemInFolder(logPath);
    //                 },
    //             },
    //             {
    //                 label: 'Force update check',
    //                 click: () => {
    //                     log('🔄 Forced update check...');
    //                     setupAutoUpdater();
    //                 },
    //             },
    //             {
    //                 label: 'Open DevTools',
    //                 click: () => {
    //                     win?.webContents.openDevTools();
    //                 },
    //             },
    //         ],
    //     },
    // ]);
    // Menu.setApplicationMenu(menu);

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString());
    });

    if (VITE_DEV_SERVER_URL) {
        console.log('Loading URL:', VITE_DEV_SERVER_URL);
        win.loadURL(VITE_DEV_SERVER_URL);
    } else {
        win.loadFile(path.join(RENDERER_DIST, 'index.html'));
        setTimeout(() => {
            log('Starting auto-updater...');
            setupAutoUpdater();
        }, 2000);
    }
}

export function getAutoUpdater(): AppUpdater {
    // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
    // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
    const { autoUpdater } = electronUpdater;
    return autoUpdater;
}

function setupAutoUpdater() {
    const autoUpdater = getAutoUpdater();

    log('Configuring auto-updater...');
    log(`Current version: ${app.getVersion()}`);
    log(`Log file: ${logPath}`);

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
        log('🔍 Checking for updates...');
    });

    autoUpdater.on('update-available', async (info) => {
        log(`Update available: ${info.version}`);

        const response = await dialog.showMessageBox(win!, {
            type: 'info',
            title: 'Update available',
            message: `A new version (${info.version}) is available!`,
            detail: `Current version: ${app.getVersion()}\nNew version: ${
                info.version
            }\n\nDo you want to download and install the update now?`,
            buttons: ['Download now', 'Later'],
            defaultId: 0,
            cancelId: 1,
        });

        if (response.response === 0) {
            log('User accepted download');
            autoUpdater.downloadUpdate().then();
        } else {
            log('User declined download');
        }
    });

    autoUpdater.on('update-not-available', (info) => {
        log(`No update available. Current version: ${info.version}`);
    });

    autoUpdater.on('error', (err) => {
        log(`ERROR during update: ${err.message}`);
        log(`Stack trace: ${err.stack}`);
        dialog.showErrorBox(
            'Update error',
            `An error occurred while checking for updates:\n\n${err.message}`,
        );
    });

    autoUpdater.on('download-progress', (progressObj) => {
        const logMessage = `Downloading: ${Math.round(progressObj.percent)}% - ${Math.round(
            progressObj.bytesPerSecond / 1024,
        )} KB/s`;
        log(logMessage);
        if (win) {
            win.setTitle(`Container Flow - Downloading ${Math.round(progressObj.percent)}%`);
            win.setProgressBar(progressObj.percent / 100);
        }
    });

    autoUpdater.on('update-downloaded', async (info) => {
        log(`Update downloaded: ${info.version}`);
        if (win) {
            win.setTitle('Container Flow');
        }
        const response = await dialog.showMessageBox(win!, {
            type: 'info',
            title: 'Update ready',
            message: 'The update was downloaded successfully!',
            detail: `The new version (${info.version}) is ready to be installed.\n\nDo you want to restart the application now to apply the update?`,
            buttons: ['Restart now', 'Restart later'],
            defaultId: 0,
            cancelId: 1,
        });

        if (response.response === 0) {
            log('🔄 Restarting to install...');
            autoUpdater.quitAndInstall(true, true);
        } else {
            log('⏳ Restart postponed, installation on next launch');
        }
    });

    log('🚀 Starting update check...');
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        log(`Error during checkForUpdatesAndNotify: ${err.message}`);
        log(`Stack: ${err.stack}`);
    });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        win = null;
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.whenReady().then(() => {
    createWindow();
    try {
        setupIpcHandlers();
        log('IPC handlers initialized successfully');
    } catch (error) {
        log(`Error initializing IPC handlers: ${error}`);
        console.error('Error initializing IPC handlers:', error);
    }
});

function setupIpcHandlers() {
    try {
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

        // New container handlers
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

        ipcMain.handle('docker:containers:getLogs', async (_, id, options) => {
            try {
                return await services.docker.containers.getLogs(id, options);
            } catch (error) {
                log(`Error in docker:containers:getLogs: ${error}`);
                throw error;
            }
        });

        // Docker images handlers
        ipcMain.handle('docker:images:pull', async (_, image) => {
            try {
                return await services.docker.image.pull(image);
            } catch (error) {
                log(`Error in docker:images:pull: ${error}`);
                throw error;
            }
        });

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

        // WordPress handlers
        ipcMain.handle('docker:wordpress:setup', async (_, options) => {
            try {
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

        ipcMain.handle('docker:wordpress:delete', async (_, options) => {
            try {
                return await services.docker.wordpress.delete(options);
            } catch (error) {
                log(`Error in docker:wordpress:delete: ${error}`);
                throw error;
            }
        });

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

        log('All IPC handlers registered successfully');
    } catch (error) {
        log(`Error setting up IPC handlers: ${error}`);
        throw error;
    }
}
