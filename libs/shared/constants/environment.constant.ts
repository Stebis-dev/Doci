/**
 * Shared environment configuration for the application
 * This file contains configuration values used across both web and Electron environments
 */

export const ENVIRONMENT = {
    /**
     * GitHub OAuth configuration
     */
    azureFunctionUrl: 'https://dociwsg.azurewebsites.net/api/githubTokenExchange',
    github: {
        electronClientId: 'Ov23liB7fwzCeuRerMNu',
        webClientId: 'Ov23ligReddkTeQ2gdzi',
        defaultClientId: 'Ov23liRVD5sTmwN0o08F',
        url: 'https://github.com/login/oauth/authorize?',
        apiUrl: 'https://api.github.com',
        redirectUri: {
            web: '/auth/callback',
            electron: 'doci://oauth/callback'
        },
        scopes: 'repo'
    }
}; 