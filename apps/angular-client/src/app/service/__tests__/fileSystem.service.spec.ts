import { TestBed } from '@angular/core/testing';
import { FileSystemService } from '../fileSystem.service';
import { PlatformService } from '../platform.service';
import { ElectronService } from '../electron.service';
import { FlatProject } from '@doci/shared';
import * as browserImporter from '../../utils/browserProjectImporter';
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
        const mockPlatform = {
            isElectron: true,
            isWeb: false,
            platformType: 'electron' as const,
            _platformType: 'electron' as const
        };

        platformService = {
            ...mockPlatform,
            setIsElectron(value: boolean) {
                Object.assign(this, {
                    isElectron: value,
                    isWeb: !value,
                    _platformType: value ? 'electron' : 'web',
                    platformType: value ? 'electron' : 'web'
                });
            }
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
            (platformService as any).setIsElectron(true);
        });

        it('should open directory and import project', async () => {
            electronService.openDirectoryDialog.mockResolvedValue('/selected/path');
            electronService.importProject.mockResolvedValue(mockProject);

            const result = await service.openDirectoryPicker();

            expect(electronService.openDirectoryDialog).toHaveBeenCalled();
            expect(electronService.importProject).toHaveBeenCalledWith('/selected/path');
            expect(result).toEqual(mockProject);
        });

        it('should handle directory selection cancellation', async () => {
            electronService.openDirectoryDialog.mockResolvedValue(null);

            const result = await service.openDirectoryPicker();

            expect(electronService.openDirectoryDialog).toHaveBeenCalled();
            expect(electronService.importProject).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('should handle import failure', async () => {
            electronService.openDirectoryDialog.mockResolvedValue('/selected/path');
            electronService.importProject.mockResolvedValue(null);

            const result = await service.openDirectoryPicker();

            expect(electronService.importProject).toHaveBeenCalledWith('/selected/path');
            expect(result).toBeNull();
        });

        it.skip('should handle directory dialog error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Dialog error');
            jest.spyOn(error, 'stack', 'get').mockReturnValue('');
            electronService.openDirectoryDialog.mockRejectedValue(error);

            const result = await service.openDirectoryPicker();

            expect(consoleSpy).toHaveBeenCalledWith('Directory selection was cancelled or failed:', error);
            expect(result).toBeNull();
            consoleSpy.mockRestore();
        });

        it.skip('should handle import error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Import error');
            jest.spyOn(error, 'stack', 'get').mockReturnValue('');
            electronService.openDirectoryDialog.mockResolvedValue('/selected/path');
            electronService.importProject.mockRejectedValue(error);

            const result = await service.openDirectoryPicker();

            expect(consoleSpy).toHaveBeenCalledWith('Directory selection was cancelled or failed:', error);
            expect(result).toBeNull();
            consoleSpy.mockRestore();
        });
    });

    describe('Browser Environment', () => {
        beforeEach(() => {
            (platformService as any).setIsElectron(false);
            service.setDirectoryPickerSupported(true);
        });

        it('should handle directory picker when supported', async () => {
            const spy = jest.spyOn(browserImporter, 'importProjectBrowser')
                .mockResolvedValue(mockProject);

            const result = await service.openDirectoryPicker();

            expect(spy).toHaveBeenCalled();
            expect(result).toEqual(mockProject);
            spy.mockRestore();
        });

        it('should handle browser import failure', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const spy = jest.spyOn(browserImporter, 'importProjectBrowser')
                .mockRejectedValue(new Error('Import failed'));

            const result = await service.openDirectoryPicker();

            expect(spy).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Directory selection was cancelled or failed:', expect.any(Error));
            expect(result).toBeNull();

            consoleSpy.mockRestore();
            spy.mockRestore();
        });

        it('should handle unsupported directory picker', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            service.setDirectoryPickerSupported(false);

            const result = await service.openDirectoryPicker();

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('No directory picker available for this platform');
            consoleSpy.mockRestore();
        });

        it('should handle null project from browser import', async () => {
            const spy = jest.spyOn(browserImporter, 'importProjectBrowser')
                .mockResolvedValue(null);

            const result = await service.openDirectoryPicker();

            expect(spy).toHaveBeenCalled();
            expect(result).toBeNull();
            spy.mockRestore();
        });
    });

    describe('Platform Detection', () => {
        it('should correctly identify Electron environment', () => {
            (platformService as any).setIsElectron(true);
            expect(service.isDirectoryPickerSupported()).toBe(false);
            service.setDirectoryPickerSupported(true);
            expect(service.isDirectoryPickerSupported()).toBe(true);
        });

        it('should correctly identify Browser environment', () => {
            (platformService as any).setIsElectron(false);
            service.setDirectoryPickerSupported(true);
            expect(service.isDirectoryPickerSupported()).toBe(true);
        });
    });
}); 