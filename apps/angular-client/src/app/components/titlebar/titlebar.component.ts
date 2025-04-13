import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../service/electron.service';
import { PlatformService } from '../../service/platform.service';
import { IconComponent } from '../icon.component';
import { BrandingComponent } from '../branding/branding.component';
import { ProjectService } from '../../service/project.service';
import { FlatProject } from '@doci/sharedModels';

interface MenuItem {
  label: string;
  action?: () => void;
  submenu?: MenuItem[];
  isShown: boolean;
}

@Component({
  selector: 'app-titlebar',
  imports: [CommonModule, IconComponent, BrandingComponent],
  templateUrl: './titlebar.component.html',
  styleUrl: './titlebar.component.css',
})

export class TitleBarComponent implements OnInit {

  isMaximized = false;
  enableWindowControlButtons = false;
  isElectron = false;
  projectName: string | null = null;
  menuItems: MenuItem[] = [];

  constructor(
    private platformService: PlatformService,
    private electronService: ElectronService,
    private projectService: ProjectService,
  ) {
    if (this.platformService.isElectron) {
      this.isElectron = true;
      this.enableWindowControlButtons = true;

      this.electronService.isMaximized$.subscribe((maximized: boolean) => {
        this.isMaximized = maximized;
      });
    }
    this.updateMenuItems();
  }

  ngOnInit(): void {
    this.projectService.currentProject$.subscribe((project: FlatProject | null) => {
      this.projectName = project ? project.name + '/' : null;
    });
  }

  updateMenuItems(): void {
    this.menuItems = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Select Local Project',
            action: () => this.selectLocalProject(),
            isShown: true,
          },
          {
            label: 'Exit',
            action: () => this.close(),
            isShown: this.isElectron,
          },
        ],
        isShown: true,
      },
    ];
  }

  async selectLocalProject(): Promise<void> {
    this.projectService.selectLocalProject();
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
