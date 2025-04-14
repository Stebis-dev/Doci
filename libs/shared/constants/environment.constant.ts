/**
 * Shared environment configuration for the application
 * This file contains configuration values used across both web and Electron environments
 */

export const ENVIRONMENT = {
    /**
     * GitHub OAuth configuration
     */
    github: {
        url: 'https://github.com/login/oauth/authorize?',
        apiUrl: 'https://api.github.com',
        redirectUri: {
            web: '/auth/callback',
            electron: 'doci://oauth/callback'
        },
        scopes: ['repo']
    }
}; 