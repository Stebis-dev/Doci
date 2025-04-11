import { Injectable } from '@angular/core';
import { PlatformService } from './platform.service';
import { ElectronService } from './electron.service';

@Injectable({
    providedIn: 'root'
})
export class FileSystemService {
    constructor(
        private platformService: PlatformService,
        private electronService: ElectronService
    ) { }

    async openDirectoryPicker(): Promise<string | null> {

        if (this.platformService.isElectron) {
            return this.electronService.openDirectoryDialog() ?? null;
        }

        if ('showDirectoryPicker' in window) {
            try {
                // * This is the File System Access API, which does not give full paths
                // * but rather handles for files and directories.
                // * The path is not accessible directly due to security reasons.

                // * For continuing the project selection this should directly 
                // * read the directory with the files and the contents of it

                const directoryHandle = await (window as any).showDirectoryPicker();
                console.log('Directory handle:', directoryHandle);
                console.log("path:", "web:///" + directoryHandle.name);
                // * Add directoryHandle to the file system or perform any other operations
                // * Use browser-fs-access library 
                return null;
            } catch (err) {
                console.error('Directory selection was cancelled or failed:', err);
                return null;
            }
        }

        return null;
    }
}