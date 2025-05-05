// Mock Octokit and other external dependencies
jest.mock('@octokit/rest', () => ({
    Octokit: jest.fn().mockImplementation(() => ({
        rest: {
            repos: {
                listForAuthenticatedUser: jest.fn()
            }
        }
    }))
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TitleBarComponent } from './titlebar.component';
import { ElectronService } from '../../service/electron.service';
import { PlatformService } from '../../service/platform.service';
import { ProjectService } from '../../service/project.service';
import { GitHubAuthService } from '../../service/github/github-auth.service';
import { GitHubService } from '../../service/github/github.service';
import { ThemeService } from '../../service/theme.service';
import { BehaviorSubject, of } from 'rxjs';
import { IconComponent } from '../icon.component';
import { BrandingComponent } from '../branding/branding.component';
import { GitHubRepoModalComponent } from '../github-repo-modal/github-repo-modal.component';

describe('TitleBarComponent', () => {
    let component: TitleBarComponent;
    let fixture: ComponentFixture<TitleBarComponent>;
    let electronService: Partial<ElectronService>;
    let platformService: Partial<PlatformService>;
    let projectService: Partial<ProjectService>;
    let githubAuthService: Partial<GitHubAuthService>;
    let githubService: Partial<GitHubService>;
    let themeService: Partial<ThemeService>;
    let isMaximized$: BehaviorSubject<boolean>;
    let currentProject$: BehaviorSubject<any>;
    let isAuthenticated$: BehaviorSubject<boolean>;
    let currentTheme$: BehaviorSubject<'light' | 'dark'>;

    beforeEach(async () => {
        isMaximized$ = new BehaviorSubject<boolean>(false);
        currentProject$ = new BehaviorSubject<any>(null);
        isAuthenticated$ = new BehaviorSubject<boolean>(false);
        currentTheme$ = new BehaviorSubject<'light' | 'dark'>('light');

        electronService = {
            minimize: jest.fn(),
            maximize: jest.fn(),
            close: jest.fn(),
            isMaximized$
        };

        platformService = {
            isElectron: true
        };

        projectService = {
            currentProject$,
            selectLocalProject: jest.fn()
        };

        githubAuthService = {
            isAuthenticated$,
            login: jest.fn().mockReturnValue(of({ token: 'test-token' })),
            logout: jest.fn()
        };

        githubService = {};

        themeService = {
            currentTheme$,
            toggleTheme: jest.fn()
        };

        await TestBed.configureTestingModule({
            imports: [TitleBarComponent, IconComponent, BrandingComponent, GitHubRepoModalComponent],
            providers: [
                { provide: ElectronService, useValue: electronService },
                { provide: PlatformService, useValue: platformService },
                { provide: ProjectService, useValue: projectService },
                { provide: GitHubAuthService, useValue: githubAuthService },
                { provide: GitHubService, useValue: githubService },
                { provide: ThemeService, useValue: themeService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TitleBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Initialization', () => {
        it('should initialize with electron features when platform is electron', () => {
            expect(component.isElectron).toBe(true);
            expect(component.enableWindowControlButtons).toBe(true);
        });

        it('should update isMaximized when electron window state changes', () => {
            isMaximized$.next(true);
            expect(component.isMaximized).toBe(true);

            isMaximized$.next(false);
            expect(component.isMaximized).toBe(false);
        });

        it('should update project name when current project changes', () => {
            currentProject$.next({ name: 'test-project' });
            expect(component.projectName).toBe('test-project/');

            currentProject$.next(null);
            expect(component.projectName).toBeNull();
        });

        it('should update GitHub authentication status', () => {
            isAuthenticated$.next(true);
            expect(component.isGitHubAuthenticated).toBe(true);

            isAuthenticated$.next(false);
            expect(component.isGitHubAuthenticated).toBe(false);
        });

        it('should update theme when theme changes', () => {
            currentTheme$.next('dark');
            expect(component.currentTheme).toBe('dark');

            currentTheme$.next('light');
            expect(component.currentTheme).toBe('light');
        });
    });

    describe('Menu Items', () => {
        it('should update menu items based on GitHub authentication status', async () => {
            // Initial state (not authenticated)
            isAuthenticated$.next(false);
            fixture.detectChanges();
            await fixture.whenStable();

            let githubMenu = component.menuItems.find(item => item.label === 'GitHub');
            expect(githubMenu?.submenu?.find(item => item.label === 'Connect with GitHub')?.isShown).toBe(true);
            expect(githubMenu?.submenu?.find(item => item.label === 'Logout from GitHub')?.isShown).toBe(false);

            // Change to authenticated state
            isAuthenticated$.next(true);
            fixture.detectChanges();
            await fixture.whenStable();

            githubMenu = component.menuItems.find(item => item.label === 'GitHub');
            expect(githubMenu?.submenu?.find(item => item.label === 'Connect with GitHub')?.isShown).toBe(false);
            expect(githubMenu?.submenu?.find(item => item.label === 'Logout from GitHub')?.isShown).toBe(true);
        });
    });

    describe('Actions', () => {
        it('should call selectLocalProject when action is triggered', () => {
            component.selectLocalProject();
            expect(projectService.selectLocalProject).toHaveBeenCalled();
        });

        it('should handle GitHub login', async () => {
            await component.connectWithGitHub();
            expect(githubAuthService.login).toHaveBeenCalled();
        });

        it('should handle GitHub logout', () => {
            component.logoutFromGithub();
            expect(githubAuthService.logout).toHaveBeenCalled();
        });

        it('should toggle theme', () => {
            component.toggleApplicationTheme();
            expect(themeService.toggleTheme).toHaveBeenCalled();
        });

        it('should toggle GitHub repo modal', () => {
            expect(component.showGitHubRepoModal).toBe(false);

            component.showGitHubRepositories();
            expect(component.showGitHubRepoModal).toBe(true);

            component.closeGitHubRepoModal();
            expect(component.showGitHubRepoModal).toBe(false);
        });
    });

    describe('Window Controls', () => {
        it('should call electron minimize', () => {
            component.minimize();
            expect(electronService.minimize).toHaveBeenCalled();
        });

        it('should call electron maximize', () => {
            component.toggleMaximize();
            expect(electronService.maximize).toHaveBeenCalled();
        });

        it('should call electron close', () => {
            component.close();
            expect(electronService.close).toHaveBeenCalled();
        });
    });

    describe('Event Handling', () => {
        it('should execute action and prevent default event behavior', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            } as unknown as MouseEvent;

            const mockAction = jest.fn();

            component.executeAction(mockAction, mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockEvent.stopPropagation).toHaveBeenCalled();
            expect(mockAction).toHaveBeenCalled();
        });
    });
}); 