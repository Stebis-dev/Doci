import { BrowserWindow, ipcMain, session, app } from 'electron';
import * as url from 'url';
import * as http from 'http';
import * as https from 'https';
import App from '../app';
import { ENVIRONMENT, GitHubAuthCredentials } from '@doci/shared';

export default class GitHubAuthAPI {
    private static readonly clientId = ENVIRONMENT.github.electronClientId;
    private static readonly scopes = ENVIRONMENT.github.scopes;
    private static readonly azureFunctionUrl = ENVIRONMENT.azureFunctionUrl;

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

            console.log('GitHub OAuth URL:', authUrl);

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
            // Call Azure Function instead of GitHub directly
            const azureFunctionUrl = `${this.azureFunctionUrl}?code=${code}&environment=electron`;

            console.log('Calling Azure Function for token exchange:', azureFunctionUrl);

            const parsedUrl = url.parse(azureFunctionUrl);
            const isHttps = parsedUrl.protocol === 'https:';

            const requestModule = isHttps ? https : http;

            const req = requestModule.get(azureFunctionUrl, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);

                        if (response.error) {
                            reject(new Error(`Azure Function error: ${response.error}`));
                            return;
                        }

                        const credentials: GitHubAuthCredentials = {
                            accessToken: response.accessToken,
                            tokenType: response.tokenType,
                            scope: response.scope,
                            expiresAt: response.expiresAt
                        };

                        resolve(credentials);
                    } catch (error) {
                        reject(new Error(`Failed to parse Azure Function response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Azure Function request failed: ${error.message}`));
            });

            req.end();
        });
    }
} 