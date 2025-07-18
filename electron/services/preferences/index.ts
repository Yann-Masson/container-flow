import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

interface SSHPreferences {
    host: string;
    port: string;
    username: string;
}

class PreferencesService {
    private preferencesPath: string;

    constructor() {
        const userDataPath = app.getPath('userData');
        this.preferencesPath = path.join(userDataPath, 'preferences.encrypted');
    }

    private ensurePreferencesFile(): void {
        if (!fs.existsSync(this.preferencesPath)) {
            this.savePreferences({
                host: '',
                port: '22',
                username: 'root'
            });
        }
    }

    getSSHPreferences(): SSHPreferences {
        try {
            this.ensurePreferencesFile();

            // Check if safeStorage is available
            if (!safeStorage.isEncryptionAvailable()) {
                console.warn('Encryption is not available, falling back to default values');
                return {
                    host: '',
                    port: '22',
                    username: 'root'
                };
            }

            const encryptedData = fs.readFileSync(this.preferencesPath);
            const decryptedBuffer = safeStorage.decryptString(encryptedData);
            const preferences = JSON.parse(decryptedBuffer);

            return preferences.ssh || {
                host: '',
                port: '22',
                username: 'root'
            };
        } catch (error) {
            console.error('Error reading encrypted preferences:', error);
            return {
                host: '',
                port: '22',
                username: 'root'
            };
        }
    }

    saveSSHPreferences(sshPreferences: SSHPreferences): void {
        try {
            // Check if safeStorage is available
            if (!safeStorage.isEncryptionAvailable()) {
                console.warn('Encryption is not available, preferences will not be saved');
                return;
            }

            let preferences: { ssh?: SSHPreferences } = {};

            // Try to read existing preferences if file exists
            if (fs.existsSync(this.preferencesPath)) {
                try {
                    const encryptedData = fs.readFileSync(this.preferencesPath);
                    const decryptedBuffer = safeStorage.decryptString(encryptedData);
                    preferences = JSON.parse(decryptedBuffer);
                } catch (error) {
                    console.warn('Could not decrypt existing preferences, creating new file');
                    preferences = {};
                }
            }

            preferences.ssh = sshPreferences;

            // Encrypt and save the preferences
            const dataToEncrypt = JSON.stringify(preferences, null, 2);
            const encryptedBuffer = safeStorage.encryptString(dataToEncrypt);
            fs.writeFileSync(this.preferencesPath, encryptedBuffer);

            console.log('SSH preferences saved securely');
        } catch (error) {
            console.error('Error saving encrypted preferences:', error);
        }
    }

    private savePreferences(sshPreferences: SSHPreferences): void {
        if (!safeStorage.isEncryptionAvailable()) {
            console.warn('Encryption is not available, cannot save initial preferences');
            return;
        }

        const preferences = { ssh: sshPreferences };
        const dataToEncrypt = JSON.stringify(preferences, null, 2);
        const encryptedBuffer = safeStorage.encryptString(dataToEncrypt);
        fs.writeFileSync(this.preferencesPath, encryptedBuffer);
    }
}

export default new PreferencesService();
