import { app } from "electron";
import fs from "fs";
import path from "path";

export default function clear(): void {
    try {
        const userDataPath = app.getPath('userData');
        const preferencesPath = path.join(userDataPath, 'app.encrypted');

        if (fs.existsSync(preferencesPath)) {
            fs.unlinkSync(preferencesPath);
            console.log('App preferences cleared successfully');
        } else {
            console.log('No app preferences file to clear');
        }
    } catch (error) {
        console.error('Error clearing app preferences:', error);
        throw error;
    }
}
