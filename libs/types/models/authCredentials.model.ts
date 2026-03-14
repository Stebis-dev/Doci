export interface GitHubAuthCredentials {
    accessToken: string;
    tokenType: string;
    scope: string;
    expiresAt?: number;
}

export interface GitHubAuthResponse {
    code: string;
    state: string;
}