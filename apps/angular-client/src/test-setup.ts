import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// Initialize test environment
setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

// Mock Octokit
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        repos: {
          listForAuthenticatedUser: jest.fn().mockResolvedValue({
            data: []
          }),
          getContent: jest.fn().mockResolvedValue({
            data: []
          })
        }
      }
    }))
  };
});

// Mock window.electron if needed
(window as any).electron = {
  minimize: jest.fn(),
  maximize: jest.fn(),
  close: jest.fn(),
  isMaximized: jest.fn()
};
