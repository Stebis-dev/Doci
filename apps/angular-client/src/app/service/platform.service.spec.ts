import { TestBed } from '@angular/core/testing';
import { PlatformService, PlatformType } from './platform.service';

describe('PlatformService', () => {
    let service: PlatformService;
    let originalUserAgent: string;

    beforeEach(() => {
        // Store original userAgent
        originalUserAgent = window.navigator.userAgent;
    });

    afterEach(() => {
        // Restore original userAgent
        Object.defineProperty(window.navigator, 'userAgent', {
            value: originalUserAgent,
            configurable: true
        });
    });

    const mockUserAgent = (agent: string) => {
        Object.defineProperty(window.navigator, 'userAgent', {
            value: agent,
            configurable: true
        });
    };

    describe('Electron Environment', () => {
        beforeEach(() => {
            mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Electron/28.1.0 Chrome/114.0.5735.289 Safari/537.36');
            TestBed.configureTestingModule({});
            service = TestBed.inject(PlatformService);
        });

        it('should detect Electron platform', () => {
            expect(service.isElectron).toBe(true);
            expect(service.isWeb).toBe(false);
            expect(service.platformType).toBe(PlatformType.ELECTRON);
        });

        it('should have consistent platform type', () => {
            expect(service.platformType).toBe(PlatformType.ELECTRON);
            expect(service['_platformType']).toBe(PlatformType.ELECTRON);
        });
    });

    describe('Web Environment', () => {
        beforeEach(() => {
            mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
            TestBed.configureTestingModule({});
            service = TestBed.inject(PlatformService);
        });

        it('should detect Web platform', () => {
            expect(service.isElectron).toBe(false);
            expect(service.isWeb).toBe(true);
            expect(service.platformType).toBe(PlatformType.WEB);
        });

        it('should have consistent platform type', () => {
            expect(service.platformType).toBe(PlatformType.WEB);
            expect(service['_platformType']).toBe(PlatformType.WEB);
        });
    });

    describe('Platform Type Enum', () => {
        it('should have correct enum values', () => {
            expect(PlatformType.ELECTRON).toBeDefined();
            expect(PlatformType.WEB).toBeDefined();
            expect(Object.keys(PlatformType).length).toBe(4); // 2 values × 2 (enum creates reverse mappings)
        });
    });
}); 