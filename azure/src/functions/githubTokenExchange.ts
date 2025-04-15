import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as https from 'https';
import * as querystring from 'querystring';

const GITHUB_CREDENTIALS = {
    electron: {
        clientId: process.env.GITHUB_ELECTRON_CLIENT_ID ?? '',
        clientSecret: process.env.GITHUB_ELECTRON_CLIENT_SECRET ?? ''
    },
    web: {
        clientId: process.env.GITHUB_WEB_CLIENT_ID ?? '',
        clientSecret: process.env.GITHUB_WEB_CLIENT_SECRET ?? ''
    },
    default: {
        clientId: process.env.GITHUB_CLIENT_ID ?? '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ''
    }
};

export async function githubTokenExchange(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`GitHub token exchange function processed request for url "${request.url}"`);

    try {
        const code = request.query.get('code');
        const environment = request.query.get('environment');

        if (!code) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'Missing authorization code' })
            };
        }
        if (!environment) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'Missing environment' })
            };
        }

        const credentials = GITHUB_CREDENTIALS[environment] ?? GITHUB_CREDENTIALS.default;

        if (!credentials.clientId || !credentials.clientSecret) {
            return {
                status: 400,
                body: JSON.stringify({ error: `Missing credentials for environment: ${environment}` })
            };
        }

        const tokenResponse = await exchangeCodeForToken(code, credentials);

        return {
            status: 200,
            jsonBody: tokenResponse
        };
    } catch (error) {
        context.error('Error in GitHub token exchange:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Failed to exchange token', message: error.message })
        };
    }
}

async function exchangeCodeForToken(code: string, credentials: { clientId: string, clientSecret: string }): Promise<any> {
    return new Promise((resolve, reject) => {
        const tokenRequestData = querystring.stringify({
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            code: code
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
                    console.log(response);

                    if (response.error) {
                        reject(new Error(`GitHub OAuth error: ${response.error_description ?? response.error}`));
                        return;
                    }

                    const credentials = {
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

app.http('githubTokenExchange', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: githubTokenExchange
});
