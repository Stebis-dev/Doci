import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../service/electron.service';
import { PlatformService } from '../../service/platform.service';
import { IconComponent } from '../icon.component';
import { BrandingComponent } from '../branding/branding.component';
import { FileSystemService } from '../../service/fileSystem.service';

interface MenuItem {
  label: string;
  action?: () => void;
  submenu?: MenuItem[];
}

@Component({
  selector: 'app-titlebar',
  imports: [CommonModule, IconComponent, BrandingComponent],
  templateUrl: './titlebar.component.html',
  styleUrl: './titlebar.component.css',
})

export class TitleBarComponent {

  menuItems: MenuItem[] = [
    {
      label: 'File',
      submenu: [
        { label: 'Select Local Project', action: () => this.selectLocalProject(), },
        { label: 'Exit', action: () => this.close(), }
      ],
    },
  ]

  isMaximized = false;
  enableWindowControlButtons = false;

  constructor(
    private platformService: PlatformService,
    private electronService: ElectronService,
    private fileSystemService: FileSystemService
  ) {
    if (this.platformService.isElectron) {
      this.enableWindowControlButtons = true;

      this.electronService.isMaximized$.subscribe((maximized: boolean) => {
        this.isMaximized = maximized;
      });
    }
  }

  async selectLocalProject(): Promise<void> {
    try {
      const result = await this.fileSystemService.openDirectoryPicker();

      if (result) {
        console.log('Selected directory/files:', result);
        // * Handle the selected directory or files here
        // * Different processing might be needed based on whether it's:
        // * - A path string (from Electron)
        // * - A directory handle object (from File System Access API)
        // * - An array of File objects (from the fallback method)
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  }

  executeAction(action: () => void, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (action) {
      action();
    }
  }

  minimize() {
    this.electronService.minimize();
  }

  toggleMaximize() {
    this.electronService.maximize();
  }

  close() {
    this.electronService.close();
  }
}
