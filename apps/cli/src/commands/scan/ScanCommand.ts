import { CliError } from 'apps/cli/src/error-handler';
import * as fs from 'fs';
import * as path from 'path';


export abstract class Scan {
    private static _files: string[] = [];
    private static _directoryEntry: string;
    public static get files(): string[] {
        return this._files;
    }

    public static validateDirectoryEntry(dir: string): void {
        // validate directory
        if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
            throw new CliError('Invalid directory', dir);
        }
    }


    // ignore folders and files that match patterns
    // scan .gitignore files for patterns to ignore
    public static traverseDirectory(d: string): void {
        for (const name of fs.readdirSync(d)) {
            const full = path.join(d, name);
            this._files.push(full);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) this.traverseDirectory(full);
        }
    };
}



