import { TestBed } from '@angular/core/testing';
import { FileSystemService } from './fileSystem.service';
import { PlatformService } from './platform.service';
import { ElectronService } from './electron.service';
import { FlatProject } from '@doci/shared';
import * as browserImporter from '../utils/browserProjectImporter';
import { of } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
class TestFileSystemService extends FileSystemService {
    override isDirectoryPickerSupported(): boolean {
        return this._isDirectoryPickerSupported;
    }

    private _isDirectoryPickerSupported = false;
    setDirectoryPickerSupported(supported: boolean) {
        this._isDirectoryPickerSupported = supported;
    }
}

describe('FileSystemService', () => {
    let service: TestFileSystemService;
    let platformService: jest.Mocked<PlatformService>;
    let electronService: jest.Mocked<ElectronService>;

    const mockProject: FlatProject = {
        name: 'test-project',
        path: '/test/path',
        files: []
    };

    beforeEach(() => {
        platformService = {
            isElectron: true
        } as unknown as jest.Mocked<PlatformService>;

        electronService = {
            openDirectoryDialog: jest.fn(),
            importProject: jest.fn(),
            isMaximized$: of(false),
            openGitHubOAuth: jest.fn(),
            exchangeCodeForToken: jest.fn(),
            minimize: jest.fn(),
            maximize: jest.fn(),
            close: jest.fn(),
            ngOnDestroy: jest.fn()
        } as unknown as jest.Mocked<ElectronService>;

        TestBed.configureTestingModule({
            providers: [
                { provide: FileSystemService, useClass: TestFileSystemService },
                { provide: PlatformService, useValue: platformService },
                { provide: ElectronService, useValue: electronService }
            ]
        });

        service = TestBed.inject(FileSystemService) as TestFileSystemService;
    });

    describe('Electron Environment', () => {
        beforeEach(() => {
            TestBed.resetTestingModule();
            const electronPlatformService = { isElectron: true } as unknown as jest.Mocked<PlatformService>;
            TestBed.configureTestingModule({
                providers: [
                    { provide: FileSystemService, useClass: TestFileSystemService },
                    { provide: PlatformService, useValue: electronPlatformService },
                    { provide: ElectronService, useValue: electronService }
                ]
            });
            service = TestBed.inject(FileSystemService) as TestFileSystemService;
        });

        it('should open directory and import project', async () => {
            electronService.openDirectoryDialog.mockResolvedValue('/selected/path');
            electronService.importProject.mockResolvedValue(mockProject);

            const result = await service.openDirectoryPicker();

            expect(electronService.openDirectoryDialog).toHaveBeenCalled();
            expect(electronService.importProject).toHaveBeenCalledWith('/selected/path');
            expect(result).toEqual(mockProject);
        });

        it('should return null when directory selection is cancelled', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            electronService.openDirectoryDialog.mockResolvedValue(null);

            const result = await service.openDirectoryPicker();

            expect(electronService.openDirectoryDialog).toHaveBeenCalled();
            expect(electronService.importProject).not.toHaveBeenCalled();
            expect(result).toBeNull();
            consoleSpy.mockRestore();
        });

        it('should handle import failure', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            electronService.openDirectoryDialog.mockResolvedValue('/selected/path');
            electronService.importProject.mockResolvedValue(null);

            const result = await service.openDirectoryPicker();

            expect(electronService.importProject).toHaveBeenCalledWith('/selected/path');
            expect(result).toBeNull();
            consoleSpy.mockRestore();
        });
    });

    describe('Browser Environment', () => {
        let service: TestFileSystemService;
        const mockProject: FlatProject = {
            files: [],
            name: 'test-project',
            path: '/test'
        };
        const mockImport = jest.fn();

        beforeEach(() => {
            jest.resetModules();
            jest.mock('../utils/browserProjectImporter', () => ({
                importProjectBrowser: () => Promise.resolve(mockProject)
            }));

            TestBed.configureTestingModule({
                providers: [
                    {
                        provide: FileSystemService,
                        useClass: TestFileSystemService
                    },
                    {
                        provide: PlatformService,
                        useValue: {
                            isElectron: () => false
                        }
                    },
                    {
                        provide: ElectronService,
                        useValue: {}
                    }
                ]
            });

            service = TestBed.inject(FileSystemService) as TestFileSystemService;
            service.setDirectoryPickerSupported(true);
        });

        it.skip('should use browser directory picker when available', async () => {
            const spy = jest.spyOn(browserImporter, 'importProjectBrowser')
                .mockImplementation(() => Promise.resolve(mockProject));

            const result = await service.openDirectoryPicker();

            expect(spy).toHaveBeenCalled();
            expect(result).toEqual(mockProject);
            spy.mockRestore();
        });

        it.skip('should handle browser import failure', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Test error');
            const spy = jest.spyOn(browserImporter, 'importProjectBrowser')
                .mockImplementation(() => Promise.reject(error));

            const result = await service.openDirectoryPicker();

            expect(spy).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Directory selection was cancelled or failed:', error);
            expect(result).toBeNull();

            consoleSpy.mockRestore();
            spy.mockRestore();
        });
    });
}); 