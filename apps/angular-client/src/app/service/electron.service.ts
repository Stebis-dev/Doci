import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PlatformService } from './platform.service';

interface ElectronWindowAPI {
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
    isMaximized: () => Promise<boolean>;
    onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
    invoke: (arg0: string) => Promise<string>;
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

            // Set up listener for changes
            this.cleanupListener = this.electronAPI.onMaximizedChange((isMaximized) => {
                // Use NgZone to ensure Angular detects the change
                this.ngZone.run(() => {
                    this._isMaximized.next(isMaximized);
                });
            });
        }
    }

    openDirectoryDialog(): Promise<string | null> {
        if (this.electronAPI) {
            return this.electronAPI.invoke('open-directory-dialog');
        }
        return Promise.resolve(null);
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