/**
 * This module is responsible on handling all the inter process communications
 * between the frontend to the electron backend.
 */

import { app, dialog, ipcMain } from 'electron';
import { environment } from '../../environments/environment';
import { importProject } from '../handler/projectImporter.handler';
export default class ElectronEvents {
  static bootstrapElectronEvents(): Electron.IpcMain {
    return ipcMain;
  }
}

// Retrieve app version
ipcMain.handle('get-app-version', (event) => {
  console.log(`Fetching application version... [v${environment.version}]`);

  return environment.version;
});

// TODO fix valid quit method fo application closing
// Handle App termination
ipcMain.on('quit', (event, code) => {
  app.quit();
  // app.exit(code);
});

ipcMain.handle('open-directory-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('import-project', async (_, projectPath) => {
  return importProject(projectPath);
});