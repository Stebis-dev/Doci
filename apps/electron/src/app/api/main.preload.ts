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
  // TODO ! Prevent renderer process from accessing Node.js APIs directly
  invoke: (ipcChannel: string, ...args: any[]) => ipcRenderer.invoke(ipcChannel, ...args),
  platform: process.platform,

});
