import { TestBed } from '@angular/core/testing';
import { ProjectService } from '../project.service';
import { FileSystemService } from '../fileSystem.service';
import { TreeSitterService } from '../tree-sitter/tree-sitter.service';
import { FlatProject } from '@doci/shared';
import { Tree } from 'web-tree-sitter';

describe('ProjectService', () => {
    let service: ProjectService;
    let fileSystemService: jest.Mocked<FileSystemService>;
    let treeSitterService: jest.Mocked<TreeSitterService>;
    let localStorageMock: { [key: string]: string };

    const mockProject: FlatProject = {
        name: 'test-project',
        path: '/test/path',
        files: [
            {
                name: 'test.ts',
                path: '/test/path/test.ts',
                type: 'typescript',
                content: 'class TestClass { }'
            }
        ]
    };

    const mockProjectWithAST: FlatProject = {
        ...mockProject,
        files: [
            {
                ...mockProject.files[0],
                uuid: expect.any(String),
                AST: {} as Tree,
                details: {
                    classes: [],
                    methods: [],
                    filePath: '/test/path/test.ts'
                }
            }
        ]
    };

    beforeEach(() => {
        localStorageMock = {};

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key) => localStorageMock[key]),
                setItem: jest.fn((key, value) => {
                    localStorageMock[key] = value;
                }),
                removeItem: jest.fn((key) => {
                    delete localStorageMock[key];
                })
            },
            writable: true
        });

        // Mock services
        fileSystemService = {
            openDirectoryPicker: jest.fn()
        } as unknown as jest.Mocked<FileSystemService>;

        treeSitterService = {
            initialize: jest.fn().mockResolvedValue(undefined),
            setLanguage: jest.fn().mockResolvedValue(undefined),
            parse: jest.fn().mockResolvedValue({}),
            getParser: jest.fn().mockReturnValue({})
        } as unknown as jest.Mocked<TreeSitterService>;

        TestBed.configureTestingModule({
            providers: [
                ProjectService,
                { provide: FileSystemService, useValue: fileSystemService },
                { provide: TreeSitterService, useValue: treeSitterService }
            ]
        });

        service = TestBed.inject(ProjectService);
    });

    describe('Project Selection', () => {
        it('should select local project successfully', async () => {
            fileSystemService.openDirectoryPicker.mockResolvedValue(mockProject);
            const setCurrentProjectSpy = jest.spyOn(service as any, 'setCurrentProject');

            await service.selectLocalProject();

            expect(fileSystemService.openDirectoryPicker).toHaveBeenCalled();
            expect(setCurrentProjectSpy).toHaveBeenCalledWith(mockProject);
        });

        it('should handle directory selection cancellation', async () => {
            fileSystemService.openDirectoryPicker.mockResolvedValue(null);
            const setCurrentProjectSpy = jest.spyOn(service as any, 'setCurrentProject');

            await service.selectLocalProject();

            expect(fileSystemService.openDirectoryPicker).toHaveBeenCalled();
            expect(setCurrentProjectSpy).not.toHaveBeenCalled();
        });

        it('should handle directory selection error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Selection failed');
            fileSystemService.openDirectoryPicker.mockRejectedValue(error);

            await service.selectLocalProject();

            expect(consoleSpy).toHaveBeenCalledWith('Error selecting directory:', error);
            consoleSpy.mockRestore();
        });
    });

    describe('Project Storage', () => {
        it('should save project to localStorage', async () => {
            await service.setCurrentProject(mockProject);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'doci_current_project',
                expect.any(String)
            );
            const savedProject = JSON.parse(localStorageMock['doci_current_project']);
            expect(savedProject.name).toBe(mockProject.name);
        });

        it.skip('should load stored project on initialization', async () => {
            localStorageMock['doci_current_project'] = JSON.stringify(mockProject);

            // Re-initialize service to trigger loadStoredProject
            service = TestBed.inject(ProjectService);

            expect(service.getCurrentProject()).toEqual(mockProjectWithAST);
        });

        it.skip('should handle invalid stored project data', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            localStorageMock['doci_current_project'] = 'invalid-json';

            // Re-initialize service to trigger loadStoredProject
            service = TestBed.inject(ProjectService);

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error loading stored project:',
                expect.any(Error)
            );
            consoleSpy.mockRestore();
        });

        it('should clear stored project', () => {
            service.clearStoredProject();

            expect(localStorage.removeItem).toHaveBeenCalledWith('doci_current_project');
            expect(service.getCurrentProject()).toBeNull();
        });
    });

    describe('AST Processing', () => {
        it('should convert files to AST', async () => {
            await service.setCurrentProject(mockProject);

            expect(treeSitterService.initialize).toHaveBeenCalled();
            expect(treeSitterService.setLanguage).toHaveBeenCalledWith('typescript');
            expect(treeSitterService.parse).toHaveBeenCalledWith(mockProject.files[0].content);
            expect(service.getCurrentProject()?.files[0].AST).toBeDefined();
        });

        it('should handle AST conversion errors', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            treeSitterService.parse.mockRejectedValue(new Error('Parse error'));

            await service.setCurrentProject(mockProject);

            expect(consoleSpy).toHaveBeenCalledWith(
                `Failed to parse AST for file ${mockProject.files[0].path}:`,
                expect.any(Error)
            );
            consoleSpy.mockRestore();
        });

        it('should handle TreeSitter initialization error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            treeSitterService.initialize.mockRejectedValue(new Error('Init error'));

            await service.setCurrentProject(mockProject);

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error converting files to AST:',
                expect.any(Error)
            );
            consoleSpy.mockRestore();
        });
    });

    describe('Project Updates', () => {
        it('should update current project', async () => {
            const updatedProject = { ...mockProject, name: 'updated-project' };

            await service.updateCurrentProject(updatedProject);

            expect(service.getCurrentProject()).toEqual(updatedProject);
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'doci_current_project',
                JSON.stringify(updatedProject)
            );
        });

        it('should handle update storage error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Storage error');
            (localStorage.setItem as jest.Mock).mockImplementation(() => {
                throw error;
            });

            await service.updateCurrentProject(mockProject);

            expect(consoleSpy).toHaveBeenCalledWith('Error saving project to storage:', error);
            consoleSpy.mockRestore();
        });
    });
}); 