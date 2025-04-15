import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-isMaximized'),
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window-maximized', (event, isMaximized) => {
      callback(isMaximized);
    });
  },
  importProject: (projectPath) => ipcRenderer.invoke('import-project', projectPath),
  openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),

  // GitHub OAuth methods
  openGitHubOAuth: (authUrl: string, state: string) => ipcRenderer.invoke('github:oauth', authUrl, state),
  exchangeCodeForToken: (code: string) => ipcRenderer.invoke('github:exchange-code', code),
});
