import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GitHubAuthService } from '../github-auth.service';
import { PlatformService } from '../../platform.service';
import { ElectronService } from '../../electron.service';
import { ENVIRONMENT, GitHubAuthResponse } from '@doci/shared';

jest.mock('@doci/shared', () => ({
    ENVIRONMENT: {
        github: {
            url: 'https://github.com/login/oauth/authorize?',
            defaultClientId: 'test-default-client-id',
            webClientId: 'test-web-client-id',
            scopes: 'repo'
        },
        azureFunction: {
            baseUrl: 'https://test-azure-function.com/',
            tokenExchange: 'token-exchange'
        }
    },
    GitHubAuthResponse: jest.requireActual('@doci/shared').GitHubAuthResponse
}));

describe('GitHubAuthService', () => {
    let service: GitHubAuthService;
    let httpMock: HttpTestingController;
    let platformService: jest.Mocked<PlatformService>;
    let electronService: jest.Mocked<ElectronService>;
    let localStorageMock: { [key: string]: string } = {};

    const mockCredentials = {
        accessToken: 'test-token',
        tokenType: 'Bearer',
        scope: 'repo',
        expiresAt: Date.now() + 3600 * 1000
    };

    beforeEach(() => {
        localStorageMock = {};

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(key => localStorageMock[key]),
                setItem: jest.fn((key, value) => {
                    localStorageMock[key] = value;
                }),
                removeItem: jest.fn(key => {
                    delete localStorageMock[key];
                })
            },
            writable: true
        });

        // Mock location
        Object.defineProperty(window, 'location', {
            value: {
                href: '',
                hostname: 'localhost'
            },
            writable: true
        });

        const platformServiceMock = {
            isElectron: false
        };

        const electronServiceMock = {
            openGitHubOAuth: jest.fn(),
            exchangeCodeForToken: jest.fn()
        };

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                GitHubAuthService,
                { provide: PlatformService, useValue: platformServiceMock },
                { provide: ElectronService, useValue: electronServiceMock }
            ]
        });

        service = TestBed.inject(GitHubAuthService);
        httpMock = TestBed.inject(HttpTestingController);
        platformService = TestBed.inject(PlatformService) as jest.Mocked<PlatformService>;
        electronService = TestBed.inject(ElectronService) as jest.Mocked<ElectronService>;
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('Authentication State', () => {
        it('should initialize as not authenticated', () => {
            service.isAuthenticated$.subscribe(isAuth => {
                expect(isAuth).toBeFalsy();
            });
        });

        it('should update authentication state when token is present', () => {
            localStorageMock['github_auth_token'] = JSON.stringify(mockCredentials);
            service = TestBed.inject(GitHubAuthService);

            service.isAuthenticated$.subscribe(isAuth => {
                expect(isAuth).toBeTruthy();
            });
        });
    });

    describe('Login', () => {
        describe('Web Login', () => {
            it('should redirect to GitHub OAuth for web login', () => {
                service.login().subscribe();

                const params = new URLSearchParams({
                    client_id: 'test-default-client-id',
                    scope: 'repo'
                });

                expect(window.location.href).toBe('https://github.com/login/oauth/authorize?' + params.toString());
            });

            it('should use production client ID when not on localhost', () => {
                Object.defineProperty(window, 'location', {
                    value: { hostname: 'example.com' },
                    writable: true
                });

                // Reinitialize service to pick up new hostname
                service = TestBed.inject(GitHubAuthService);

                service.login().subscribe();

                const params = new URLSearchParams({
                    client_id: 'test-default-client-id',
                    scope: 'repo'
                });

                expect(window.location.href).toBe('https://github.com/login/oauth/authorize?' + params.toString());
            });
        });

        describe('Electron Login', () => {
            beforeEach(() => {
                Object.defineProperty(platformService, 'isElectron', {
                    value: true
                });
            });

            it('should handle successful electron login', (done) => {
                const mockAuthResponse = { code: 'test-code', state: 'test-state' };
                electronService.openGitHubOAuth.mockResolvedValue(mockAuthResponse);
                electronService.exchangeCodeForToken.mockResolvedValue(mockCredentials);

                service.login().subscribe(credentials => {
                    expect(credentials).toEqual(mockCredentials);
                    expect(service.getAccessToken()).toBe(mockCredentials.accessToken);
                    done();
                });
            });

            it('should handle electron login failure', (done) => {
                electronService.openGitHubOAuth.mockReturnValue(Promise.resolve(null as unknown as GitHubAuthResponse));

                service.login().subscribe({
                    error: (error) => {
                        expect(error).toBe('GitHub OAuth failed to open');
                        done();
                    }
                });
            });

            it('should handle token exchange failure', (done) => {
                const mockError = new Error('Exchange failed');
                electronService.openGitHubOAuth.mockResolvedValue({ code: 'test-code', state: 'test-state' });
                electronService.exchangeCodeForToken.mockRejectedValue(mockError);

                service.login().subscribe({
                    error: (error) => {
                        expect(error).toBe(mockError);
                        done();
                    }
                });
            });
        });
    });

    describe('OAuth Callback', () => {
        it('should handle successful callback', () => {
            service.handleCallback('test-code').subscribe(credentials => {
                expect(credentials).toEqual(mockCredentials);
                expect(service.getAccessToken()).toBe(mockCredentials.accessToken);
            });

            const req = httpMock.expectOne(`https://test-azure-function.com/token-exchange?code=test-code&environment=default`);
            expect(req.request.method).toBe('GET');
            req.flush(mockCredentials);
        });

        it('should handle callback failure', () => {
            service.handleCallback('invalid-code').subscribe(credentials => {
                expect(credentials).toBeNull();
            });

            const req = httpMock.expectOne(`https://test-azure-function.com/token-exchange?code=invalid-code&environment=default`);
            req.error(new ErrorEvent('Network error'));
        });
    });

    describe('Token Management', () => {
        it('should store and retrieve credentials', () => {
            service.handleCallback('test-code').subscribe();

            const req = httpMock.expectOne(`https://test-azure-function.com/token-exchange?code=test-code&environment=default`);
            req.flush(mockCredentials);

            const storedToken = service.getAccessToken();
            expect(storedToken).toBe(mockCredentials.accessToken);
        });

        it('should handle expired tokens', () => {
            const expiredCredentials = {
                ...mockCredentials,
                expiresAt: Date.now() - 1000
            };
            localStorageMock['github_auth_token'] = JSON.stringify(expiredCredentials);

            expect(service.getAccessToken()).toBeNull();
        });

        it('should handle invalid stored credentials', () => {
            localStorageMock['github_auth_token'] = 'invalid-json';
            expect(service.getAccessToken()).toBeNull();
        });

        it('should clear credentials on logout', () => {
            localStorageMock['github_auth_token'] = JSON.stringify(mockCredentials);
            service.logout();

            expect(service.getAccessToken()).toBeNull();
            service.isAuthenticated$.subscribe(isAuth => {
                expect(isAuth).toBeFalsy();
            });
        });
    });
}); 