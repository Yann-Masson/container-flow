import { app, safeStorage } from "electron";
import fs from "fs";
import { SSHSavedConfig } from "./ssh.type.ts";
import path from "path";

export default function save(sshConfig: SSHSavedConfig): void {
    try {
        // Check if safeStorage is available
        if (!safeStorage.isEncryptionAvailable()) {
            console.warn('Encryption is not available, preferences will not be saved');
            return;
        }

        const userDataPath = app.getPath('userData');
        const preferencesPath = path.join(userDataPath, 'ssh.encrypted');

        const preferences: { ssh?: SSHSavedConfig } = {};

        preferences.ssh = sshConfig;

        const dataToEncrypt = JSON.stringify(preferences, null, 2);
        const encryptedBuffer = safeStorage.encryptString(dataToEncrypt);
        fs.writeFileSync(preferencesPath, encryptedBuffer);

        console.log('SSH preferences saved securely');
    } catch (error) {
        console.error('Error saving encrypted preferences:', error);
    }
}
