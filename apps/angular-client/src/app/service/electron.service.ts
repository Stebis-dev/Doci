import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PlatformService } from './platform.service';
import { FlatProject } from '@doci/sharedModels';

interface ElectronWindowAPI {
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
    isMaximized: () => Promise<boolean>;
    onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
    openDirectoryDialog(): () => Promise<string | null>;
    importProject: (projectPath: string) => Promise<FlatProject>;
}

@Injectable({
    providedIn: 'root'
})
export class ElectronService implements OnDestroy {

    private _isMaximized = new BehaviorSubject<boolean>(false);
    public isMaximized$: Observable<boolean> = this._isMaximized.asObservable();

    private cleanupListener: (() => void) | null = null;

    constructor(
        private platformService: PlatformService,
        private ngZone: NgZone
    ) {
        if (this.platformService.isElectron) {
            this.init();
        }
    }

    private get electronAPI(): ElectronWindowAPI | undefined {
        if (this.platformService.isElectron) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (window as any).electronAPI;
        }
        return undefined;
    }

    private async init() {
        if (this.electronAPI) {
            const isMaximized = await this.electronAPI.isMaximized();
            this._isMaximized.next(isMaximized);

            this.cleanupListener = this.electronAPI.onMaximizedChange((isMaximized) => {
                this.ngZone.run(() => {
                    this._isMaximized.next(isMaximized);
                });
            });
        }
    }

    public async openDirectoryDialog(): Promise<string | null> {
        if (this.electronAPI) {
            const path = await this.electronAPI.openDirectoryDialog()
            return path as unknown as string | null;
        }
        return Promise.resolve(null);
    }

    public async importProject(projectPath: string): Promise<FlatProject | null> {
        try {
            if (!this.electronAPI) {
                throw new Error('Electron API is not available. This might be running in a non-Electron environment.');
            }

            const result = await this.electronAPI.importProject(projectPath);

            if (!result) {
                throw new Error('Failed to import project. No result returned : ' + result);
            }

            return result as FlatProject;
        } catch (error) {
            console.error('Failed to import project:', error);
            return null;
        }
    }

    minimize() {
        this.electronAPI?.minimizeWindow();
    }

    maximize() {
        this.electronAPI?.maximizeWindow();
    }

    close() {
        this.electronAPI?.closeWindow();
    }

    ngOnDestroy() {
        if (this.cleanupListener) {
            this.cleanupListener();
        }
    }
}