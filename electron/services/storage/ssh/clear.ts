import { app } from "electron";
import fs from "fs";
import path from "path";

export default function clear(): void {
    try {
        const userDataPath = app.getPath('userData');
        const preferencesPath = path.join(userDataPath, 'ssh.encrypted');

        if (fs.existsSync(preferencesPath)) {
            fs.unlinkSync(preferencesPath);
            console.log('SSH preferences cleared successfully');
        } else {
            console.log('No SSH preferences file to clear');
        }
    } catch (error) {
        console.error('Error clearing SSH preferences:', error);
        throw error;
    }
}
