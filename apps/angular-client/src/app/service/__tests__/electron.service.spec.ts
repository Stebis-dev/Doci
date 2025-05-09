import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ElectronService } from '../electron.service';
import { PlatformService } from '../platform.service';
import { NgZone, EventEmitter } from '@angular/core';
import { FlatProject, GitHubAuthCredentials, GitHubAuthResponse } from '@doci/shared';

describe('ElectronService', () => {
    let service: ElectronService;
    let platformService: jest.Mocked<PlatformService>;
    let ngZone: jest.Mocked<NgZone>;
    let mockElectronAPI: any;

    const mockProject: FlatProject = {
        name: 'test-project',
        path: '/test/project/path',
        files: []
    };

    const mockAuthResponse: GitHubAuthResponse = {
        code: 'test-code',
        state: 'test-state'
    };

    const mockAuthCredentials: GitHubAuthCredentials = {
        accessToken: 'test-token',
        tokenType: 'Bearer',
        scope: 'repo'
    };

    beforeEach(() => {
        mockElectronAPI = {
            minimizeWindow: jest.fn(),
            maximizeWindow: jest.fn(),
            closeWindow: jest.fn(),
            isMaximized: jest.fn().mockResolvedValue(false),
            onMaximizedChange: jest.fn(),
            openDirectoryDialog: jest.fn().mockResolvedValue('/test/path'),
            importProject: jest.fn().mockResolvedValue(mockProject),
            openGitHubOAuth: jest.fn().mockResolvedValue(mockAuthResponse),
            exchangeCodeForToken: jest.fn().mockResolvedValue(mockAuthCredentials)
        };

        platformService = {
            isElectron: true
        } as jest.Mocked<PlatformService>;

        ngZone = {
            run: jest.fn().mockImplementation(fn => fn()),
            runOutsideAngular: jest.fn().mockImplementation(fn => fn()),
            hasPendingMacrotasks: false,
            hasPendingMicrotasks: false,
            isStable: true,
            onUnstable: new EventEmitter(),
            onMicrotaskEmpty: new EventEmitter(),
            onStable: new EventEmitter(),
            onError: new EventEmitter()
        } as unknown as jest.Mocked<NgZone>;

        // Mock window.electronAPI
        (window as any).electronAPI = mockElectronAPI;

        TestBed.configureTestingModule({
            providers: [
                ElectronService,
                { provide: PlatformService, useValue: platformService },
                { provide: NgZone, useValue: ngZone }
            ]
        });

        service = TestBed.inject(ElectronService);
    });

    afterEach(() => {
        delete (window as any).electronAPI;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('initialization', () => {
        it('should check maximized state on init when in electron environment', async () => {
            await service['init']();
            expect(mockElectronAPI.isMaximized).toHaveBeenCalled();
        });

        it('should not initialize when not in electron environment', async () => {
            TestBed.resetTestingModule();
            mockElectronAPI.isMaximized.mockClear();
            const nonElectronPlatformService = { isElectron: false } as jest.Mocked<PlatformService>;
            await TestBed.configureTestingModule({
                providers: [
                    { provide: PlatformService, useValue: nonElectronPlatformService },
                    { provide: NgZone, useValue: ngZone }
                ]
            }).compileComponents();

            const newService = new ElectronService(nonElectronPlatformService, ngZone);
            await newService['init']();
            expect(mockElectronAPI.isMaximized).not.toHaveBeenCalled();
        });

        it('should setup maximized change listener', fakeAsync(() => {
            const cleanup = jest.fn();
            mockElectronAPI.onMaximizedChange.mockReturnValue(cleanup);

            service['init']();
            tick();

            expect(mockElectronAPI.onMaximizedChange).toHaveBeenCalled();

            // Test cleanup on destroy
            service.ngOnDestroy();
            expect(cleanup).toHaveBeenCalled();
        }));
    });

    describe('window controls', () => {
        it('should call minimize window', () => {
            service.minimize();
            expect(mockElectronAPI.minimizeWindow).toHaveBeenCalled();
        });

        it('should call maximize window', () => {
            service.maximize();
            expect(mockElectronAPI.maximizeWindow).toHaveBeenCalled();
        });

        it('should call close window', () => {
            service.close();
            expect(mockElectronAPI.closeWindow).toHaveBeenCalled();
        });

        it('should not call window controls when not in electron environment', async () => {
            TestBed.resetTestingModule();
            const nonElectronPlatformService = { isElectron: false } as jest.Mocked<PlatformService>;
            await TestBed.configureTestingModule({
                providers: [
                    ElectronService,
                    { provide: PlatformService, useValue: nonElectronPlatformService },
                    { provide: NgZone, useValue: ngZone }
                ]
            }).compileComponents();
            const newService = TestBed.inject(ElectronService);

            newService.minimize();
            newService.maximize();
            newService.close();

            expect(mockElectronAPI.minimizeWindow).not.toHaveBeenCalled();
            expect(mockElectronAPI.maximizeWindow).not.toHaveBeenCalled();
            expect(mockElectronAPI.closeWindow).not.toHaveBeenCalled();
        });
    });

    describe('project operations', () => {
        it('should open directory dialog', async () => {
            const result = await service.openDirectoryDialog();
            expect(result).toBe('/test/path');
            expect(mockElectronAPI.openDirectoryDialog).toHaveBeenCalled();
        });

        it('should return null when opening directory dialog in non-electron environment', async () => {
            TestBed.resetTestingModule();
            const nonElectronPlatformService = { isElectron: false } as jest.Mocked<PlatformService>;
            await TestBed.configureTestingModule({
                providers: [
                    ElectronService,
                    { provide: PlatformService, useValue: nonElectronPlatformService },
                    { provide: NgZone, useValue: ngZone }
                ]
            }).compileComponents();
            const newService = TestBed.inject(ElectronService);
            const result = await newService.openDirectoryDialog();
            expect(result).toBeNull();
        });

        it('should import project', async () => {
            const result = await service.importProject('/test/path');
            expect(result).toEqual(mockProject);
            expect(mockElectronAPI.importProject).toHaveBeenCalledWith('/test/path');
        });

        it('should handle import project failure', async () => {
            mockElectronAPI.importProject.mockRejectedValue(new Error('Import failed'));
            const result = await service.importProject('/test/path');
            expect(result).toBeNull();
        });

        it('should return null when importing project in non-electron environment', async () => {
            TestBed.resetTestingModule();
            const nonElectronPlatformService = { isElectron: false } as jest.Mocked<PlatformService>;
            await TestBed.configureTestingModule({
                providers: [
                    ElectronService,
                    { provide: PlatformService, useValue: nonElectronPlatformService },
                    { provide: NgZone, useValue: ngZone }
                ]
            }).compileComponents();
            const newService = TestBed.inject(ElectronService);
            const result = await newService.importProject('/test/path');
            expect(result).toBeNull();
        });
    });

    describe('GitHub authentication', () => {
        it('should open GitHub OAuth', async () => {
            const result = await service.openGitHubOAuth();
            expect(result).toEqual(mockAuthResponse);
            expect(mockElectronAPI.openGitHubOAuth).toHaveBeenCalled();
        });

        it('should return null when opening GitHub OAuth in non-electron environment', async () => {
            TestBed.resetTestingModule();
            const nonElectronPlatformService = { isElectron: false } as jest.Mocked<PlatformService>;
            await TestBed.configureTestingModule({
                providers: [
                    ElectronService,
                    { provide: PlatformService, useValue: nonElectronPlatformService },
                    { provide: NgZone, useValue: ngZone }
                ]
            }).compileComponents();
            const newService = TestBed.inject(ElectronService);
            const result = newService.openGitHubOAuth();
            expect(result).toBeNull();
        });

        it('should exchange code for token', async () => {
            const result = await service.exchangeCodeForToken({ code: 'test-code', state: 'test-state' });
            expect(result).toEqual(mockAuthCredentials);
            expect(mockElectronAPI.exchangeCodeForToken).toHaveBeenCalledWith('test-code');
        });

        it('should return null when exchanging code in non-electron environment', async () => {
            TestBed.resetTestingModule();
            const nonElectronPlatformService = { isElectron: false } as jest.Mocked<PlatformService>;
            await TestBed.configureTestingModule({
                providers: [
                    ElectronService,
                    { provide: PlatformService, useValue: nonElectronPlatformService },
                    { provide: NgZone, useValue: ngZone }
                ]
            }).compileComponents();
            const newService = TestBed.inject(ElectronService);
            const result = newService.exchangeCodeForToken({ code: 'test-code', state: 'test-state' });
            expect(result).toBeNull();
        });
    });

    describe('maximized state management', () => {
        it('should update maximized state through NgZone', fakeAsync(() => {
            const callback = mockElectronAPI.onMaximizedChange.mock.calls[0][0];

            callback(true);
            tick();

            let maximizedValue: boolean | undefined;
            service.isMaximized$.subscribe(value => maximizedValue = value);
            expect(maximizedValue).toBe(true);
            expect(ngZone.run).toHaveBeenCalled();
        }));
    });
});