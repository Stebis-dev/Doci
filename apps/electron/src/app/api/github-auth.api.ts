import { BrowserWindow, ipcMain, session, app } from 'electron';
import * as url from 'url';
import * as https from 'https';
import * as querystring from 'querystring';
import App from '../app';
import { ENVIRONMENT, GitHubAuthCredentials } from '@doci/shared';
import { getEnv } from '../utils/env.util';

export default class GitHubAuthAPI {
    private static readonly clientId = getEnv('GITHUB_CLIENT_ID', '');
    private static readonly clientSecret = getEnv('GITHUB_CLIENT_SECRET', ''); // TODO put into electron variables
    private static readonly redirectUri = ENVIRONMENT.github.redirectUri.electron;
    private static readonly scopes = ENVIRONMENT.github.scopes;

    static registerIpcHandlers(): void {
        if (App.isDevelopmentMode()) {
            app.removeAsDefaultProtocolClient('doci');
            app.setAsDefaultProtocolClient('doci');
        } else {
            app.setAsDefaultProtocolClient('doci');
        }

        ipcMain.handle('github:oauth', async () => {
            return this.handleOAuthFlow();
        });

        ipcMain.handle('github:exchange-code', async (_event, code: string) => {
            return this.exchangeCodeForToken(code);
        });
    }

    private static handleOAuthFlow(): Promise<{ code: string; state: string }> {
        return new Promise((resolve, reject) => {
            const authWindow = new BrowserWindow({
                width: 800,
                height: 600,
                show: true,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            session.defaultSession.clearStorageData({
                storages: ['cookies']
            });

            const githubUrl = ENVIRONMENT.github.url;
            const authUrl =
                githubUrl + 'client_id=' + GitHubAuthAPI.clientId + '&scope=' + GitHubAuthAPI.scopes;

            authWindow.loadURL(authUrl);
            authWindow.show();

            authWindow.on('closed', () => {
                reject(new Error('Authentication window was closed'));
            });

            authWindow.webContents.on('will-navigate', (event, newUrl) => {
                this.handleCallback(newUrl, authWindow, resolve, reject);
            });

            authWindow.webContents.on('will-redirect', (event, newUrl) => {
                this.handleCallback(newUrl, authWindow, resolve, reject);
            });
        });
    }

    private static handleCallback(
        callbackUrl: string,
        authWindow: BrowserWindow,
        resolve: (value: { code: string; state: string }) => void,
        reject: (reason: Error) => void
    ): void {

        const parsedUrl = url.parse(callbackUrl, true);
        console.log('Parsed URL:', parsedUrl);

        if (parsedUrl.protocol !== 'doci:') {
            return;
        }

        if (!parsedUrl.query.code) {
            authWindow.close();
            reject(new Error('No code or state returned from GitHub'));
            return;
        }


        const code = parsedUrl.query.code as string;
        const state = parsedUrl.query.stat as string || '';

        authWindow.close();

        resolve({ code, state });
    }

    private static exchangeCodeForToken(code: string): Promise<GitHubAuthCredentials> {
        return new Promise((resolve, reject) => {
            const tokenRequestData = querystring.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: code,
                redirect_uri: this.redirectUri
            });

            const options = {
                hostname: 'github.com',
                port: 443,
                path: '/login/oauth/access_token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': tokenRequestData.length,
                    'Accept': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);

                        if (response.error) {
                            reject(new Error(`GitHub OAuth error: ${response.error_description || response.error}`));
                            return;
                        }

                        const credentials: GitHubAuthCredentials = {
                            accessToken: response.access_token,
                            tokenType: response.token_type,
                            scope: response.scope,
                            expiresAt: Date.now() + (response.expires_in ? response.expires_in * 1000 : 3600 * 1000)
                        };

                        resolve(credentials);
                    } catch (error) {
                        reject(new Error(`Failed to parse GitHub response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`GitHub token request failed: ${error.message}`));
            });

            req.write(tokenRequestData);
            req.end();
        });
    }
} 