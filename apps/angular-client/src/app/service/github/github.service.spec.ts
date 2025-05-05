import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GitHubService } from './github.service';
import { GitHubAuthService } from './github-auth.service';
import { of, throwError } from 'rxjs';
import { ENVIRONMENT, GitHubRepo } from '@doci/shared';

describe('GitHubService', () => {
    let service: GitHubService;
    let httpClient: jest.Mocked<HttpClient>;
    let authService: jest.Mocked<GitHubAuthService>;

    const mockToken = 'test-token';
    const mockApiUrl = ENVIRONMENT.github.apiUrl;

    const mockHeaders = new HttpHeaders({
        'Authorization': `Bearer ${mockToken}`,
        'Accept': 'application/vnd.github.v3+json'
    });

    beforeEach(() => {
        const httpMock = {
            get: jest.fn()
        };

        const authServiceMock = {
            getAccessToken: jest.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                GitHubService,
                { provide: HttpClient, useValue: httpMock },
                { provide: GitHubAuthService, useValue: authServiceMock }
            ]
        });

        service = TestBed.inject(GitHubService);
        httpClient = TestBed.inject(HttpClient) as jest.Mocked<HttpClient>;
        authService = TestBed.inject(GitHubAuthService) as jest.Mocked<GitHubAuthService>;
    });

    describe('getUserRepositories', () => {
        const mockRepoResponse = [
            {
                id: 1,
                name: 'repo1',
                full_name: 'owner/repo1',
                private: false,
                html_url: 'https://github.com/owner/repo1',
                description: 'Test repo 1'
            },
            {
                id: 2,
                name: 'repo2',
                full_name: 'owner/repo2',
                private: true,
                html_url: 'https://github.com/owner/repo2',
                description: 'Test repo 2'
            }
        ];

        it.skip('should return mapped repositories when authenticated', (done) => {
            authService.getAccessToken.mockReturnValue(mockToken);
            httpClient.get.mockReturnValue(of(mockRepoResponse));

            service.getUserRepositories().subscribe(repos => {
                expect(repos.length).toBe(2);
                expect(repos[0]).toEqual({
                    id: 1,
                    name: 'repo1',
                    fullName: 'owner/repo1',
                    private: false,
                    htmlUrl: 'https://github.com/owner/repo1',
                    description: 'Test repo 1',
                    owner: { login: 'owner' },
                    defaultBranch: 'main'
                } as GitHubRepo);
                expect(httpClient.get).toHaveBeenCalledWith(
                    `${mockApiUrl}/user/repos`,
                    { headers: mockHeaders }
                );
                done();
            });
        });

        it('should return empty array when not authenticated', (done) => {
            authService.getAccessToken.mockReturnValue(null);

            service.getUserRepositories().subscribe(repos => {
                expect(repos).toEqual([]);
                expect(httpClient.get).not.toHaveBeenCalled();
                done();
            });
        });

        it('should handle API errors gracefully', (done) => {
            authService.getAccessToken.mockReturnValue(mockToken);
            httpClient.get.mockReturnValue(throwError(() => new Error('API Error')));

            service.getUserRepositories().subscribe(repos => {
                expect(repos).toEqual([]);
                done();
            });
        });
    });

    describe('getRepositoryContents', () => {
        const mockOwner = 'testOwner';
        const mockRepo = 'testRepo';
        const mockPath = 'src';
        const mockContents = [
            { name: 'file1.ts', type: 'file' },
            { name: 'dir1', type: 'dir' }
        ];

        it.skip('should return repository contents when authenticated', (done) => {
            authService.getAccessToken.mockReturnValue(mockToken);
            httpClient.get.mockReturnValue(of(mockContents));

            service.getRepositoryContents(mockOwner, mockRepo, mockPath).subscribe(contents => {
                expect(contents).toEqual(mockContents);
                expect(httpClient.get).toHaveBeenCalledWith(
                    `${mockApiUrl}/repos/${mockOwner}/${mockRepo}/contents/${mockPath}`,
                    { headers: mockHeaders }
                );
                done();
            });
        });

        it('should return empty array when not authenticated', (done) => {
            authService.getAccessToken.mockReturnValue(null);

            service.getRepositoryContents(mockOwner, mockRepo, mockPath).subscribe(contents => {
                expect(contents).toEqual([]);
                expect(httpClient.get).not.toHaveBeenCalled();
                done();
            });
        });

        it('should handle API errors gracefully', (done) => {
            authService.getAccessToken.mockReturnValue(mockToken);
            httpClient.get.mockReturnValue(throwError(() => new Error('API Error')));

            service.getRepositoryContents(mockOwner, mockRepo, mockPath).subscribe(contents => {
                expect(contents).toEqual([]);
                done();
            });
        });
    });

    describe('getFileContent', () => {
        const mockOwner = 'testOwner';
        const mockRepo = 'testRepo';
        const mockPath = 'src/file.ts';
        const mockFileContent = {
            content: 'file content',
            encoding: 'base64'
        };

        it.skip('should return file content when authenticated', (done) => {
            authService.getAccessToken.mockReturnValue(mockToken);
            httpClient.get.mockReturnValue(of(mockFileContent));

            service.getFileContent(mockOwner, mockRepo, mockPath).subscribe(content => {
                expect(content).toEqual(mockFileContent);
                expect(httpClient.get).toHaveBeenCalledWith(
                    `${mockApiUrl}/repos/${mockOwner}/${mockRepo}/contents/${mockPath}`,
                    { headers: mockHeaders }
                );
                done();
            });
        });

        it('should return empty array when not authenticated', (done) => {
            authService.getAccessToken.mockReturnValue(null);

            service.getFileContent(mockOwner, mockRepo, mockPath).subscribe(content => {
                expect(content).toEqual([]);
                expect(httpClient.get).not.toHaveBeenCalled();
                done();
            });
        });

        it('should handle API errors gracefully', (done) => {
            authService.getAccessToken.mockReturnValue(mockToken);
            httpClient.get.mockReturnValue(throwError(() => new Error('API Error')));

            service.getFileContent(mockOwner, mockRepo, mockPath).subscribe(content => {
                expect(content).toEqual([]);
                done();
            });
        });
    });

    describe('Error Handling', () => {
        it('should log API errors to console', (done) => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const mockError = new Error('API Error');

            authService.getAccessToken.mockReturnValue(mockToken);
            httpClient.get.mockReturnValue(throwError(() => mockError));

            service.getUserRepositories().subscribe(() => {
                expect(consoleSpy).toHaveBeenCalledWith('GitHub API error:', mockError);
                consoleSpy.mockRestore();
                done();
            });
        });
    });
}); 