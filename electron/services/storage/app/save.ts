import { app, safeStorage } from "electron";
import fs from "fs";
import { AppSavedConfig } from "./app.type.ts";
import path from "path";

export default function save(appConfig: AppSavedConfig): void {
    try {
        // Check if safeStorage is available
        if (!safeStorage.isEncryptionAvailable()) {
            console.warn('Encryption is not available, preferences will not be saved');
            return;
        }

        const userDataPath = app.getPath('userData');
        const preferencesPath = path.join(userDataPath, 'app.encrypted');

        const preferences: { app?: AppSavedConfig } = {};

        preferences.app = appConfig;

        const dataToEncrypt = JSON.stringify(preferences, null, 2);
        const encryptedBuffer = safeStorage.encryptString(dataToEncrypt);
        fs.writeFileSync(preferencesPath, encryptedBuffer);

        console.log('SSH preferences saved securely');
    } catch (error) {
        console.error('Error saving encrypted preferences:', error);
    }
}
