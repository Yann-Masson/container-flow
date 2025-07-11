import {app, BrowserWindow, dialog, Menu, shell} from 'electron';
import electronUpdater, {type AppUpdater} from 'electron-updater';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// import { createRequire } from 'node:module'*

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;

// Configuration des logs
const logPath = path.join(app.getPath('userData'), 'updater.log');

function log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    // Log to console
    console.log(message);

    // Log to file
    try {
        fs.appendFileSync(logPath, logMessage);
    } catch (error) {
        console.error('Error writing log:', error);
    }
}

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
        },
    });

    // Create a menu for accessing logs
    const menu = Menu.buildFromTemplate([
        {
            label: 'Debug',
            submenu: [
                {
                    label: 'Open log file',
                    click: () => {
                        shell.showItemInFolder(logPath);
                    }
                },
                {
                    label: 'Force update check',
                    click: () => {
                        log('🔄 Forced update check...');
                        setupAutoUpdater();
                    }
                },
                {
                    label: 'Open DevTools',
                    click: () => {
                        win?.webContents.openDevTools();
                    }
                }
            ]
        }
    ]);
    Menu.setApplicationMenu(menu);

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });

    if (VITE_DEV_SERVER_URL) {
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
    const {autoUpdater} = electronUpdater;
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
        log(`✅ Update available: ${info.version}`);
        log(`Release notes: ${info.releaseNotes}`);

        const response = await dialog.showMessageBox(win!, {
            type: 'info',
            title: 'Update available',
            message: `A new version (${info.version}) is available!`,
            detail: `Current version: ${app.getVersion()}\nNew version: ${info.version}\n\nDo you want to download and install the update now?`,
            buttons: ['Download now', 'Later'],
            defaultId: 0,
            cancelId: 1
        });

        if (response.response === 0) {
            log('✅ User accepted download');
            autoUpdater.downloadUpdate().then();
        } else {
            log('❌ User declined download');
        }
    });

    autoUpdater.on('update-not-available', (info) => {
        log(`❌ No update available. Current version: ${info.version}`);
    });

    autoUpdater.on('error', (err) => {
        log(`❌ ERROR during update: ${err.message}`);
        log(`Stack trace: ${err.stack}`);
        dialog.showErrorBox('Update error',
            `An error occurred while checking for updates:\n\n${err.message}`);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        const logMessage = `📥 Downloading: ${Math.round(progressObj.percent)}% - ${Math.round(progressObj.bytesPerSecond / 1024)} KB/s`;
        log(logMessage);
        if (win) {
            win.setTitle(`Container Flow - Downloading ${Math.round(progressObj.percent)}%`);
            win.setProgressBar(progressObj.percent / 100);
        }
    });

    autoUpdater.on('update-downloaded', async (info) => {
        log(`✅ Update downloaded: ${info.version}`);
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
            cancelId: 1
        });

        if (response.response === 0) {
            log('🔄 Restarting to install...');
            autoUpdater.quitAndInstall(true, true);
        } else {
            log('⏳ Restart postponed, installation on next launch');
        }
    });

    log('🚀 Starting update check...');
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
        log(`❌ Error during checkForUpdatesAndNotify: ${err.message}`);
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

app.whenReady().then(createWindow);
