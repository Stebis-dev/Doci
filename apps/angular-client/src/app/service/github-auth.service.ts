import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { PlatformService } from './platform.service';
import { ENVIRONMENT, GitHubAuthResponse } from '@doci/shared';
import { ElectronService } from './electron.service';

export interface GitHubAuthCredentials {
    accessToken: string;
    tokenType: string;
    scope: string;
    expiresAt?: number;
}

@Injectable({
    providedIn: 'root'
})
export class GitHubAuthService {
    // private clientId = ENVIRONMENT.github.clientId;
    // private clientSecret = ''; // Only needed for server-side OAuth flow, not stored in client
    // private redirectUri = '';
    private oauthState = ''; // TODO look into it
    // private scopes = ENVIRONMENT.github.scopes;
    private tokenStorageKey = 'github_auth_token';

    private _isAuthenticated = new BehaviorSubject<boolean>(false);
    public isAuthenticated$: Observable<boolean> = this._isAuthenticated.asObservable();

    constructor(
        private http: HttpClient,
        private platformService: PlatformService,
        private electronService: ElectronService
    ) {
        this.checkAuth();
    }

    public login(): Observable<GitHubAuthCredentials | null> {
        // this.oauthState = this.generateRandomState(); // Create random state for CSRF protection

        if (this.platformService.isElectron) {
            return this.loginElectron();
        } else {
            // return this.loginWeb();
            return of(null);
        }
    }

    public logout(): void {
        localStorage.removeItem(this.tokenStorageKey);
        this._isAuthenticated.next(false);
    }

    private checkAuth(): void {
        const token = this.getAccessToken();
        this._isAuthenticated.next(!!token);
    }

    public getAccessToken(): string | null {
        const auth = this.getStoredCredentials();
        if (!auth) return null;

        if (auth.expiresAt && auth.expiresAt < Date.now()) {
            this.logout();
            return null;
        }

        return auth.accessToken;
    }

    private loginElectron(): Observable<GitHubAuthCredentials | null> {

        return new Observable<GitHubAuthCredentials | null>(observer => {
            if (!this.electronService.openGitHubOAuth) {
                observer.error('GitHub OAuth is not available in Electron');
                return;
            }

            this.electronService.openGitHubOAuth()?.then((result: GitHubAuthResponse) => {
                if (!result) {
                    observer.error('GitHub OAuth failed to open');
                    return;
                }
                this.electronService.exchangeCodeForToken(result)?.then((credentials: GitHubAuthCredentials) => {
                    this.storeCredentials(credentials);
                    this._isAuthenticated.next(true);
                    observer.next(credentials);
                    observer.complete();
                }).catch((error: any) => {
                    console.error('Error exchanging code for token', error);
                    observer.error(error);
                })
            });
        });
    }

    // private loginWeb(): Observable<GitHubAuthCredentials | null> {
    //     // Store state in localStorage for verification when GitHub redirects back
    //     localStorage.setItem('github_oauth_state', this.oauthState);

    //     // Redirect to GitHub OAuth login
    //     window.location.href = this.buildAuthUrl();

    //     // This will never actually resolve because we're redirecting away
    //     return of(null);
    // }

    /**
     * Handles the OAuth callback for Web
     * This should be called from your callback component
     */
    public handleCallback(code: string, state: string): Observable<GitHubAuthCredentials | null> {
        // Verify the state parameter to prevent CSRF attacks
        const storedState = localStorage.getItem('github_oauth_state');
        localStorage.removeItem('github_oauth_state'); // Clean up

        if (state !== storedState) {
            return of(null);
        }

        // In a real app, you'd call your backend to exchange the code for a token
        // to avoid exposing the client secret
        return this.http.post<GitHubAuthCredentials>('/api/github/token', { code })
            .pipe(
                tap(credentials => {
                    this.storeCredentials(credentials);
                    this._isAuthenticated.next(true);
                }),
                catchError(error => {
                    console.error('Error exchanging code for token', error);
                    return of(null);
                })
            );
    }

    /**
     * Builds the GitHub authorization URL
     */
    // private buildAuthUrl(): string {
    //     const params = new URLSearchParams({
    //         client_id: this.clientId,
    //         redirect_uri: this.redirectUri,
    //         scope: this.scopes.join(' '),
    //         state: this.oauthState,
    //         response_type: 'code'
    //     });

    //     return `https://github.com/login/oauth/authorize?${params.toString()}`;
    // }

    // private generateRandomState(): string {
    //     return Math.random().toString(36).substring(2, 15) +
    //         Math.random().toString(36).substring(2, 15);
    // }

    // TODO add expiration to environment
    // TODO add storing to separate service
    private storeCredentials(credentials: GitHubAuthCredentials): void {
        // Add expiration if not present (default 1 hour)
        if (!credentials.expiresAt) {
            credentials.expiresAt = Date.now() + 3600 * 1000;
        }

        localStorage.setItem(this.tokenStorageKey, JSON.stringify(credentials));
    }

    private getStoredCredentials(): GitHubAuthCredentials | null {
        const stored = localStorage.getItem(this.tokenStorageKey);
        if (!stored) return null;

        try {
            return JSON.parse(stored) as GitHubAuthCredentials;
        } catch (e) {
            return null;
        }
    }
} 