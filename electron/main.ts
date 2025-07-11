import {app, BrowserWindow, Menu, shell} from 'electron';
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
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;

// Configuration des logs
const logPath = path.join(app.getPath('userData'), 'updater.log');

function log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    // Log dans la console
    console.log(message);

    // Log dans un fichier
    try {
        fs.appendFileSync(logPath, logMessage);
    } catch (error) {
        console.error('Erreur lors de l\'écriture du log:', error);
    }
}

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
        },
    });

    // Créer un menu pour accéder aux logs
    const menu = Menu.buildFromTemplate([
        {
            label: 'Debug',
            submenu: [
                {
                    label: 'Ouvrir le fichier de log',
                    click: () => {
                        shell.showItemInFolder(logPath);
                    }
                },
                {
                    label: 'Forcer la vérification des mises à jour',
                    click: () => {
                        log('🔄 Vérification forcée des mises à jour...');
                        setupAutoUpdater();
                    }
                },
                {
                    label: 'Ouvrir DevTools',
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
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, 'index.html'));

        // Démarrer l'auto-updater avec un délai pour s'assurer que l'app est bien chargée
        setTimeout(() => {
            log('Démarrage de l\'auto-updater...');
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

    log('Configuration de l\'auto-updater...');
    log(`Version actuelle: ${app.getVersion()}`);
    log(`Fichier de log: ${logPath}`);

    // Configuration
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // Logs pour toutes les étapes
    autoUpdater.on('checking-for-update', () => {
        log('🔍 Vérification des mises à jour...');
    });

    autoUpdater.on('update-available', (info) => {
        log(`✅ Mise à jour disponible: ${info.version}`);
        log(`Release notes: ${info.releaseNotes}`);
        autoUpdater.downloadUpdate();
    });

    autoUpdater.on('update-not-available', (info) => {
        log(`❌ Aucune mise à jour disponible. Version actuelle: ${info.version}`);
    });

    autoUpdater.on('error', (err) => {
        log(`❌ ERREUR lors de la mise à jour: ${err.message}`);
        log(`Stack trace: ${err.stack}`);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        const logMessage = `📥 Téléchargement: ${Math.round(progressObj.percent)}% - ${Math.round(progressObj.bytesPerSecond / 1024)} KB/s`;
        log(logMessage);
    });

    autoUpdater.on('update-downloaded', (info) => {
        log(`✅ Mise à jour téléchargée: ${info.version}`);
        log('🔄 Redémarrage pour installer...');
        autoUpdater.quitAndInstall();
    });

    // Démarrer la vérification
    log('🚀 Lancement de la vérification des mises à jour...');
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
        log(`❌ Erreur lors du checkForUpdatesAndNotify: ${err.message}`);
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
