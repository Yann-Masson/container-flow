import { app, safeStorage } from "electron";
import fs from "fs";
import { SSHSavedConfig } from "./ssh.type.ts";
import path from "path";

const defaultSSHConfig: SSHSavedConfig = {
    host: '',
    port: '22',
    username: 'root'
};

export default function get(): SSHSavedConfig {
    try {
        if (!safeStorage.isEncryptionAvailable()) {
            console.warn('Encryption is not available, falling back to default values');
            return defaultSSHConfig;
        }

        const userDataPath = app.getPath('userData');
        const preferencesPath = path.join(userDataPath, 'preferences.encrypted');

        const encryptedData = fs.readFileSync(preferencesPath);
        const decryptedBuffer = safeStorage.decryptString(encryptedData);
        const preferences = JSON.parse(decryptedBuffer);

        return preferences.ssh || defaultSSHConfig;
    } catch (error) {
        console.error('Error reading encrypted preferences:', error);
        return defaultSSHConfig;
    }
}