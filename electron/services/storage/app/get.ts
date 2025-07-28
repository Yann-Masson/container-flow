import { app, safeStorage } from "electron";
import fs from "fs";
import { AppPreference, AppSavedConfig } from "./app.type.ts";
import path from "path";

const defaultAppConfig: AppSavedConfig = {
    preference: AppPreference.NONE,
};

export default function get(): AppSavedConfig {
    try {
        if (!safeStorage.isEncryptionAvailable()) {
            console.warn('Encryption is not available, falling back to default values');
            return defaultAppConfig;
        }

        const userDataPath = app.getPath('userData');
        const configPath = path.join(userDataPath, 'config.encrypted');

        const encryptedData = fs.readFileSync(configPath);
        const decryptedBuffer = safeStorage.decryptString(encryptedData);
        const config = JSON.parse(decryptedBuffer);

        return config.app || defaultAppConfig;
    } catch (error) {
        console.error('Error reading encrypted config:', error);
        return defaultAppConfig;
    }
}