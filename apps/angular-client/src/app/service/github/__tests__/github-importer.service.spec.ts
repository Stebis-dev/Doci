import { TestBed } from '@angular/core/testing';
import { GitHubImporterService } from '../github-importer.service';
import { GitHubAuthService } from '../github-auth.service';
import { BehaviorSubject } from 'rxjs';
import { Octokit } from '@octokit/rest';
import { Base64 } from 'js-base64';

type GetContentResponse = {
    data: {
        type?: string;
        encoding?: string;
        size?: number;
        name?: string;
        path?: string;
        content?: string;
    } | Array<{
        type?: string;
        size?: number;
        name?: string;
        path?: string;
    }>;
};

const mockGetContent = jest.fn() as jest.MockedFunction<() => Promise<GetContentResponse>>;

jest.mock('@octokit/rest', () => {
    return {
        Octokit: jest.fn().mockImplementation(() => ({
            repos: {
                getContent: mockGetContent
            }
        }))
    };
});

describe('GitHubImporterService', () => {
    let service: GitHubImporterService;
    let authService: jest.Mocked<GitHubAuthService>;
    let mockOctokit: jest.Mocked<Octokit>;
    let isAuthenticated$: BehaviorSubject<boolean>;

    const mockToken = 'test-token';
    const mockOwner = 'test-owner';
    const mockRepo = 'test-repo';

    beforeEach(() => {
        isAuthenticated$ = new BehaviorSubject<boolean>(false);

        const authServiceMock = {
            isAuthenticated$,
            getAccessToken: jest.fn().mockReturnValue(mockToken)
        };

        TestBed.configureTestingModule({
            providers: [
                GitHubImporterService,
                { provide: GitHubAuthService, useValue: authServiceMock }
            ]
        });

        service = TestBed.inject(GitHubImporterService);
        authService = TestBed.inject(GitHubAuthService) as jest.Mocked<GitHubAuthService>;
        mockOctokit = (Octokit as jest.MockedClass<typeof Octokit>).mock.results[0].value as jest.Mocked<Octokit>;
    });

    describe('Initialization', () => {
        it('should initialize Octokit when authenticated', () => {
            isAuthenticated$.next(true);
            expect(Octokit).toHaveBeenCalledWith({ auth: mockToken });
        });

        it('should clear Octokit when not authenticated', () => {
            isAuthenticated$.next(true);
            isAuthenticated$.next(false);
            expect(service['octokit']).toBeNull();
        });
    });

    describe('importRepository', () => {
        beforeEach(() => {
            isAuthenticated$.next(true);
            mockGetContent.mockReset();
        });

        it('should throw error if not initialized', () => {
            isAuthenticated$.next(false);
            expect(() => service.importRepository(mockOwner, mockRepo))
                .toThrow('GitHub client not initialized');
        });

        it.skip('should import repository with files', (done) => {
            const mockFiles = [
                {
                    name: 'file1.ts',
                    path: 'file1.ts',
                    type: 'file',
                    size: 100
                },
                {
                    name: 'dir',
                    path: 'dir',
                    type: 'dir'
                }
            ];

            const mockFileContent = 'test content';
            const base64Content = Base64.encode(mockFileContent);

            mockGetContent
                .mockImplementationOnce(() => Promise.resolve({ data: mockFiles }))
                .mockImplementationOnce(() => Promise.resolve({
                    data: {
                        content: base64Content,
                        encoding: 'base64',
                        size: 100
                    }
                }));

            service.importRepository(mockOwner, mockRepo).subscribe(project => {
                expect(project.name).toBe(mockRepo);
                expect(project.path).toBe(`github:${mockOwner}/${mockRepo}`);
                expect(project.files.length).toBe(1);
                expect(project.files[0].content).toBe(mockFileContent);
                done();
            });
        });

        it.skip('should handle large files', (done) => {
            const mockFiles = [{
                name: 'large-file.ts',
                path: 'large-file.ts',
                type: 'file',
                size: 1024 * 1024 // 1MB
            }];

            mockGetContent.mockImplementationOnce(() => Promise.resolve({ data: mockFiles }));

            service.importRepository(mockOwner, mockRepo).subscribe(project => {
                expect(project.files[0].content).toBeUndefined();
                done();
            });
        });

        it.skip('should handle API errors gracefully', (done) => {
            const mockFiles = [{
                name: 'error-file.ts',
                path: 'error-file.ts',
                type: 'file',
                size: 100
            }];

            mockGetContent
                .mockImplementationOnce(() => Promise.resolve({ data: mockFiles }))
                .mockImplementationOnce(() => Promise.reject(new Error('API Error')));

            service.importRepository(mockOwner, mockRepo).subscribe(project => {
                expect(project.files[0].content).toBeUndefined();
                done();
            });
        });

        it('should handle non-base64 encoded content', (done) => {
            const mockFiles = [{
                name: 'file.cs',
                path: 'file.cs',
                type: 'file',
                size: 100
            }];

            mockGetContent
                .mockImplementationOnce(() => Promise.resolve({ data: mockFiles }))
                .mockImplementationOnce(() => Promise.resolve({
                    data: {
                        content: 'not-base64',
                        encoding: 'other',
                        size: 100,
                        name: 'file.cs',
                        path: 'file.cs',
                        type: 'file'
                    }
                }));

            service.importRepository(mockOwner, mockRepo).subscribe(project => {
                expect(project.files.length).toBe(1);
                expect(project.files[0].content).toBeUndefined();
                done();
            });
        });

        it('should filter non-parsable files', (done) => {
            const mockFiles = [{
                name: 'file.xyz',
                path: 'file.xyz',
                type: 'file',
                size: 100
            }];

            mockGetContent.mockImplementationOnce(() => Promise.resolve({ data: mockFiles }));

            service.importRepository(mockOwner, mockRepo).subscribe(project => {
                expect(project.files.length).toBe(0);
                done();
            });
        });

        it('should handle single file response', (done) => {
            const mockFile = {
                name: 'file.cs',
                path: 'file.cs',
                type: 'file',
                size: 100
            };

            const mockFileContent = 'test content';
            const base64Content = Base64.encode(mockFileContent);

            mockGetContent
                .mockImplementationOnce(() => Promise.resolve({ data: mockFile }))
                .mockImplementationOnce(() => Promise.resolve({
                    data: {
                        content: base64Content,
                        encoding: 'base64',
                        size: 100,
                        name: 'file.cs',
                        path: 'file.cs',
                        type: 'file'
                    }
                }));

            service.importRepository(mockOwner, mockRepo).subscribe(project => {
                expect(project.files.length).toBe(1);
                expect(project.files[0].content).toBe(mockFileContent);
                done();
            });
        });
    });

    describe('Utility Methods', () => {
        it('should get file extension', () => {
            expect(service['getFileExtension']('test.ts')).toBe('.ts');
            expect(service['getFileExtension']('test')).toBe('');
            expect(service['getFileExtension']('test.spec.ts')).toBe('.ts');
        });

        it('should handle file ignore patterns', () => {
            expect(service['shouldIgnore']('test.ts')).toBeFalsy();
            // Add more tests if ignore patterns are implemented
        });
    });
}); 