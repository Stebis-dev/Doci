import { DEFAULT_IGNORED_FILES, DEFAULT_IGNORED_FOLDERS } from 'apps/cli/src/commands/scan/scan.constants';
import { CliError } from 'apps/cli/src/error-handler';
import * as fs from 'fs';
import * as path from 'path';


export abstract class DirectoryTraverser {
    private static _gitignoreFiles: string[] = [];
    public static get gitignoreFiles(): string[] {
        return this._gitignoreFiles;
    }

    private static _ignorePatterns: string[] = [];
    public static get ignorePatterns(): string[] {
        return this._ignorePatterns;
    }

    private static _files: string[] = [];
    public static get files(): string[] {
        return this._files;
    }

    public static validateDirectoryEntry(dir: string): void {
        // validate directory
        if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
            throw new CliError('Invalid directory', dir);
        }
    }

    public static findGitignoreFiles(d: string): string[] {

        for (const name of fs.readdirSync(d)) {
            const full = path.join(d, name);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                this._gitignoreFiles.push(...this.findGitignoreFiles(full));
            } else if (name === '.gitignore') {
                this._gitignoreFiles.push(full);
            }
        }
        return this._gitignoreFiles;
    }

    public static generateIgnorePatterns(): string[] {
        this._ignorePatterns = [...DEFAULT_IGNORED_FOLDERS, ...DEFAULT_IGNORED_FILES];
        for (const gitignoreFile of this._gitignoreFiles) {
            const content = fs.readFileSync(gitignoreFile, 'utf-8');
            const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
            this._ignorePatterns.push(...lines);
        }
        return this._ignorePatterns;
    }

    // ignore folders and files that match patterns
    // scan .gitignore files for patterns to ignore
    public static traverseDirectory(d: string): void {
        for (const name of fs.readdirSync(d)) {
            if (this._ignorePatterns.includes(name)) {
                continue;
            }

            const full = path.join(d, name);
            this._files.push(full);
            const stat = fs.statSync(full);

            if (stat.isDirectory()) {
                this.traverseDirectory(full);
            }
        }
    };
}



