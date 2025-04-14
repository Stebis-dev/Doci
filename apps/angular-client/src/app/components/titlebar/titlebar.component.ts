import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../service/electron.service';
import { PlatformService } from '../../service/platform.service';
import { IconComponent } from '../icon.component';
import { BrandingComponent } from '../branding/branding.component';
import { ProjectService } from '../../service/project.service';
import { FlatProject } from '@doci/shared';
import { GitHubAuthService } from '../../service/github-auth.service';
import { GitHubService } from '../../service/github.service';

interface MenuItem {
  label: string;
  action?: () => void;
  submenu?: MenuItem[];
  isShown: boolean;
  isDisabled: boolean;
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
  isGitHubAuthenticated = false;
  projectName: string | null = null;
  menuItems: MenuItem[] = [];

  constructor(
    private platformService: PlatformService,
    private electronService: ElectronService,
    private projectService: ProjectService,
    private githubAuthService: GitHubAuthService,
    private githubService: GitHubService
  ) {
    if (this.platformService.isElectron) {
      this.isElectron = true;
      this.enableWindowControlButtons = true;

      this.electronService.isMaximized$.subscribe((maximized: boolean) => {
        this.isMaximized = maximized;
      });
    }
  }

  ngOnInit(): void {
    this.projectService.currentProject$.subscribe((project: FlatProject | null) => {
      this.projectName = project ? project.name + '/' : null;
    });
    this.githubAuthService.isAuthenticated$.subscribe((isAuthenticated: boolean) => {
      this.isGitHubAuthenticated = isAuthenticated;
      console.log("isAuthenticated", isAuthenticated)
      this.updateMenuItems();
    })

    this.updateMenuItems();
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
            isDisabled: false
          },
          {
            label: 'Exit',
            action: () => this.close(),
            isShown: this.isElectron,
            isDisabled: false
          },
        ],
        isShown: true,
        isDisabled: false
      },
      {
        label: 'GitHub',
        submenu: [
          {
            label: 'Connect with GitHub',
            action: () => this.connectWithGitHub(),
            isShown: !this.isGitHubAuthenticated,
            isDisabled: this.isGitHubAuthenticated
          },
          {
            label: 'Logout from GitHub',
            action: () => this.logoutFromGithub(),
            isShown: this.isGitHubAuthenticated,
            isDisabled: !this.isGitHubAuthenticated
          },
          {
            label: 'Show all repositories',
            action: () => this.getGitHubRepos(),
            isShown: this.isGitHubAuthenticated,
            isDisabled: !this.isGitHubAuthenticated
          }
        ],
        isShown: true,
        isDisabled: false
      },
    ];
  }

  async selectLocalProject(): Promise<void> {
    this.projectService.selectLocalProject();
  }

  async connectWithGitHub(): Promise<void> {
    this.githubAuthService.login().subscribe({
      next: (credentials) => {
        // this.isLoading = false;
        if (credentials) {
          console.log('Successfully authenticated with GitHub', credentials);
          // You can emit an event or use a service to notify the rest of the app
        }
      },
      error: (error) => {
        // this.isLoading = false;
        console.error('GitHub authentication failed:', error);
        // You can show an error message to the user
      }
    });
  }

  getGitHubRepos(): void {
    if (this.isGitHubAuthenticated) {
      this.githubService.getUserRepositories().subscribe({
        next: (repos) => {
          console.log('GitHub repositories:', repos);
        },
        error: (error) => {
          console.error('Error fetching GitHub repositories:', error);
        },
        complete: () => {
          console.log('Finished fetching GitHub repositories');
        }
      });
    } else {
      console.warn('User is not authenticated with GitHub');
    }
  }

  logoutFromGithub(): void {
    this.githubAuthService.logout();
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
