import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../service/electron.service';
import { PlatformService } from '../../service/platform.service';
import { IconComponent } from '../icon.component';
import { BrandingComponent } from '../branding/branding.component';
import { ProjectService } from '../../service/project.service';
import { FlatProject } from '@doci/shared';
import { GitHubAuthService } from '../../service/github/github-auth.service';
import { GitHubService } from '../../service/github/github.service';
import { GitHubRepoModalComponent } from '../github-repo-modal/github-repo-modal.component';
import { ThemeService } from '../../service/theme.service';

interface MenuItem {
  label: string;
  action?: () => void;
  submenu?: MenuItem[];
  isShown: boolean;
  isDisabled: boolean;
}

@Component({
  selector: 'app-titlebar',
  imports: [CommonModule, IconComponent, BrandingComponent, GitHubRepoModalComponent],
  templateUrl: './titlebar.component.html',
  styleUrl: './titlebar.component.css',
  standalone: true
})
export class TitleBarComponent implements OnInit {
  isMaximized = false;
  enableWindowControlButtons = false;
  isElectron = false;
  isGitHubAuthenticated = false;
  projectName: string | null = null;
  menuItems: MenuItem[] = [];
  showGitHubRepoModal = false;
  currentTheme: 'light' | 'dark' = 'light';
  isLoading = false;

  constructor(
    private platformService: PlatformService,
    private electronService: ElectronService,
    private projectService: ProjectService,
    private githubAuthService: GitHubAuthService,
    private githubService: GitHubService,
    private themeService: ThemeService
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
      this.isLoading = false;
    });

    this.projectService.isLoading$.subscribe((loading: boolean) => {
      this.isLoading = loading;
    });

    this.githubAuthService.isAuthenticated$.subscribe((isAuthenticated: boolean) => {
      this.isGitHubAuthenticated = isAuthenticated;
      console.log("isAuthenticated", isAuthenticated)
      this.updateMenuItems();
    })

    this.updateMenuItems();
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
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
            action: () => this.showGitHubRepositories(),
            isShown: this.isGitHubAuthenticated,
            isDisabled: !this.isGitHubAuthenticated
          }
        ],
        isShown: true,
        isDisabled: false
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Toggle Theme',
            action: () => this.toggleApplicationTheme(),
            isShown: true,
            isDisabled: false
          },
        ],
        isShown: true,
        isDisabled: false
      },
    ];
  }
  toggleApplicationTheme(): void {
    this.themeService.toggleTheme();
  }

  async selectLocalProject(): Promise<void> {
    this.projectService.selectLocalProject();
  }

  async connectWithGitHub(): Promise<void> {
    this.githubAuthService.login().subscribe({
      next: (credentials) => {
        if (credentials) {
          console.log('Successfully authenticated with GitHub', credentials);
        }
      },
      error: (error) => {
        console.error('GitHub authentication failed:', error);
      }
    });
  }

  showGitHubRepositories(): void {
    this.showGitHubRepoModal = true;
  }

  closeGitHubRepoModal(): void {
    this.showGitHubRepoModal = false;
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
