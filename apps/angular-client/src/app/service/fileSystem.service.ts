import { Injectable } from '@angular/core';
import { PlatformService } from './platform.service';
import { ElectronService } from './electron.service';
import { FlatProject } from '@doci/shared';
import { importProjectBrowser } from '../utils/browserProjectImporter';

@Injectable({
    providedIn: 'root'
})
export class FileSystemService {
    constructor(
        private readonly platformService: PlatformService,
        private readonly electronService: ElectronService,
    ) { }

    // Protected method for easier testing
    protected isDirectoryPickerSupported(): boolean {
        return 'showDirectoryPicker' in window && typeof window.showDirectoryPicker === 'function';
    }

    async openDirectoryPicker(): Promise<FlatProject | null> {
        try {
            if (this.platformService.isElectron) {
                return this.handleElectronPicker();
            }
            else if (this.isDirectoryPickerSupported()) {
                return this.handleBrowserPicker();
            }

            console.error('No directory picker available for this platform');
            return null;
        } catch (err) {
            console.error('Directory picker operation failed:', err);
            return null;
        }
    }

    private async handleElectronPicker(): Promise<FlatProject | null> {
        const projectPath = await this.electronService.openDirectoryDialog() ?? null;
        if (!projectPath) {
            console.error('No project path selected or cancelled');
            return null;
        }
        return this.electronService.importProject(projectPath);
    }

    private async handleBrowserPicker(): Promise<FlatProject | null> {
        try {
            return await importProjectBrowser();
        } catch (err) {
            console.error('Directory selection was cancelled or failed:', err);
            return null;
        }
    }
}