import { app, safeStorage } from "electron";
import fs from "fs";
import { AppSavedConfig, AppPreference } from "./app.type.ts";
import path from "path";
import get from './get';

export default function save(appConfig: AppSavedConfig): void {
    try {
        // Check if safeStorage is available
        if (!safeStorage.isEncryptionAvailable()) {
            console.warn('Encryption is not available, preferences will not be saved');
            return;
        }

        const userDataPath = app.getPath('userData');
        const preferencesPath = path.join(userDataPath, 'app.encrypted');

        // Merge with existing (to avoid dropping unknown future fields)
        const existing = get();
        const merged: AppSavedConfig = {
            ...existing,
            ...appConfig,
            // Ensure preference always has a value
            preference: (appConfig.preference ?? existing.preference) ?? AppPreference.NONE,
        };
        const preferences: { app?: AppSavedConfig } = { app: merged };

        const dataToEncrypt = JSON.stringify(preferences, null, 2);
        const encryptedBuffer = safeStorage.encryptString(dataToEncrypt);
        fs.writeFileSync(preferencesPath, encryptedBuffer);

    console.log('App preferences saved securely');
    } catch (error) {
        console.error('Error saving encrypted preferences:', error);
    }
}
