import { Injectable } from '@angular/core';

export enum PlatformType {
    ELECTRON,
    WEB
}

@Injectable({
    providedIn: 'root'
})
export class PlatformService {
    private _platformType: PlatformType;

    constructor() {
        this._platformType = window.navigator.userAgent.includes('Electron') ? PlatformType.ELECTRON : PlatformType.WEB;
    }

    get isElectron(): boolean {
        return this._platformType === PlatformType.ELECTRON;
    }

    get isWeb(): boolean {
        return this._platformType === PlatformType.WEB;
    }

    get platformType(): PlatformType {
        return this._platformType;
    }
}