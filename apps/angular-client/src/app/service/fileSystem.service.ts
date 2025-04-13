import { Injectable } from '@angular/core';
import { PlatformService } from './platform.service';
import { ElectronService } from './electron.service';
import { FlatProject } from '@doci/sharedModels';
import { importProjectBrowser } from '../utils/browserProjectImporter';

@Injectable({
    providedIn: 'root'
})
export class FileSystemService {
    constructor(
        private platformService: PlatformService,
        private electronService: ElectronService,
    ) { }

    async openDirectoryPicker(): Promise<FlatProject | null> {

        if (this.platformService.isElectron) {
            const projectPath = await this.electronService.openDirectoryDialog() ?? null;

            if (projectPath) {
                return this.electronService.importProject(projectPath);
            } else {
                console.error('No project path selected or cancelled');
                return null;
            }
        }
        else if ('showDirectoryPicker' in window) {
            try {
                return importProjectBrowser();
            } catch (err) {
                console.error('Directory selection was cancelled or failed:', err);
                return null;
            }
        }

        return null;
    }
}