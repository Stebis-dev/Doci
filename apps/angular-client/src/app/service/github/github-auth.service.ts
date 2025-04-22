import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PlatformService } from '../platform.service';
import { ENVIRONMENT, GitHubAuthResponse } from '@doci/shared';
import { ElectronService } from '../electron.service';

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
    private readonly clientId = ENVIRONMENT.github.webClientId;
    private readonly scopes = ENVIRONMENT.github.scopes;
    private readonly tokenStorageKey = 'github_auth_token';
    private readonly azureFunctionUrl = ENVIRONMENT.azureFunctionUrl;

    private readonly isProduction = window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1';

    private _isAuthenticated = new BehaviorSubject<boolean>(false);
    public isAuthenticated$: Observable<boolean> = this._isAuthenticated.asObservable();

    constructor(
        private readonly http: HttpClient,
        private readonly platformService: PlatformService,
        private readonly electronService: ElectronService
    ) {
        this.checkAuth();
    }

    public login(): Observable<GitHubAuthCredentials | null> {

        if (this.platformService.isElectron) {
            return this.loginElectron();
        } else {
            return this.loginWeb();
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

    private loginWeb(): Observable<GitHubAuthCredentials | null> {
        console.log('environmentParam', this.isProduction);

        const params = new URLSearchParams({
            client_id: !this.isProduction ? ENVIRONMENT.github.defaultClientId : ENVIRONMENT.github.webClientId,
            scope: this.scopes,
        });

        const authUrl = ENVIRONMENT.github.url + params.toString();
        console.log('Redirecting to GitHub OAuth login...', authUrl);

        window.location.href = authUrl;

        // This will never actually resolve because we're redirecting away
        return of(null);
    }

    public handleCallback(code: string): Observable<GitHubAuthCredentials | null> {
        const environmentParam = !this.isProduction ? 'default' : 'web';

        const url = `${this.azureFunctionUrl}?code=${code}&environment=${environmentParam}`;
        const options = {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: false
        };

        return this.http.get<GitHubAuthCredentials>(url, options)
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