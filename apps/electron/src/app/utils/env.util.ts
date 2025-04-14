import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export function loadEnv(): Record<string, string> {
    const envPath = path.resolve(process.cwd(), '.env');

    if (fs.existsSync(envPath)) {
        const result = dotenv.config({ path: envPath });

        if (result.error) {
            console.error('Error loading .env file:', result.error);
            return {};
        }

        return result.parsed || {};
    }

    if (app && app.isPackaged) {
        const resourcesPath = path.join(process.resourcesPath, '.env');

        if (fs.existsSync(resourcesPath)) {
            const result = dotenv.config({ path: resourcesPath });

            if (result.error) {
                console.error('Error loading .env file from resources:', result.error);
                return {};
            }

            return result.parsed || {};
        }
    }

    console.warn('.env file not found, using default environment variables');
    return {};
}

export function getEnv(key: string): string {
    if (process.env[key]) {
        return process.env[key];
    }

    return '';
} 