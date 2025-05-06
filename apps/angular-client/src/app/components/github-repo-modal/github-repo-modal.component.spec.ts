import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GitHubRepoModalComponent } from './github-repo-modal.component';
import { GitHubService } from '../../service/github/github.service';
import { GitHubImporterService } from '../../service/github/github-importer.service';
import { ProjectService } from '../../service/project.service';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { GitHubRepo, FlatProject } from '@doci/shared';

describe('GitHubRepoModalComponent', () => {
    let component: GitHubRepoModalComponent;
    let fixture: ComponentFixture<GitHubRepoModalComponent>;
    let githubService: jest.Mocked<GitHubService>;
    let githubImporterService: jest.Mocked<GitHubImporterService>;
    let projectService: jest.Mocked<ProjectService>;

    const mockRepos: GitHubRepo[] = [
        {
            name: 'repo1',
            description: 'Description 1',
            owner: { login: 'user1' }
        },
        {
            name: 'test-repo',
            description: 'Test Description',
            owner: { login: 'user1' }
        }
    ] as GitHubRepo[];

    beforeEach(async () => {
        // Create mock services
        const githubServiceMock = {
            getUserRepositories: jest.fn()
        };

        const githubImporterServiceMock = {
            importRepository: jest.fn()
        };

        const projectServiceMock = {
            setCurrentProject: jest.fn()
        };

        await TestBed.configureTestingModule({
            imports: [FormsModule, GitHubRepoModalComponent],
            providers: [
                { provide: GitHubService, useValue: githubServiceMock },
                { provide: GitHubImporterService, useValue: githubImporterServiceMock },
                { provide: ProjectService, useValue: projectServiceMock }
            ]
        }).compileComponents();

        githubService = TestBed.inject(GitHubService) as jest.Mocked<GitHubService>;
        githubImporterService = TestBed.inject(GitHubImporterService) as jest.Mocked<GitHubImporterService>;
        projectService = TestBed.inject(ProjectService) as jest.Mocked<ProjectService>;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GitHubRepoModalComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('initialization', () => {
        it('should load repositories on init', fakeAsync(() => {
            githubService.getUserRepositories.mockReturnValue(of(mockRepos));

            fixture.detectChanges();
            tick();

            expect(githubService.getUserRepositories).toHaveBeenCalled();
            expect(component.repos).toEqual(mockRepos);
            expect(component.filteredRepos).toEqual(mockRepos);
            expect(component.isLoading).toBeFalsy();
        }));

        it('should handle error when loading repositories', fakeAsync(() => {
            const error = new Error('Failed to load');
            githubService.getUserRepositories.mockReturnValue(throwError(() => error));

            fixture.detectChanges();
            tick();

            expect(component.error).toBe('Failed to load repositories. Please try again.');
            expect(component.isLoading).toBeFalsy();
        }));
    });

    describe('filtering repositories', () => {
        beforeEach(() => {
            component.repos = mockRepos;
            component.filteredRepos = mockRepos;
        });

        it('should filter repositories by name', () => {
            component.searchTerm = 'test';
            component.filterRepos();

            expect(component.filteredRepos.length).toBe(1);
            expect(component.filteredRepos[0].name).toBe('test-repo');
        });

        it('should filter repositories by description', () => {
            component.searchTerm = 'test description';
            component.filterRepos();

            expect(component.filteredRepos.length).toBe(1);
            expect(component.filteredRepos[0].description).toBe('Test Description');
        });

        it('should show all repositories when search term is empty', () => {
            component.searchTerm = '';
            component.filterRepos();

            expect(component.filteredRepos).toEqual(mockRepos);
        });
    });

    describe('repository selection', () => {
        const mockRepo = mockRepos[0];
        const mockProject: FlatProject = {
            name: 'Project 1',
            path: '/path/to/project',
            files: []
        };

        it.skip('should import selected repository successfully', fakeAsync(() => {
            githubImporterService.importRepository.mockReturnValue(of(mockProject));

            component.selectRepository(mockRepo);
            tick();

            expect(githubImporterService.importRepository).toHaveBeenCalledWith(mockRepo.owner.login, mockRepo.name);
            expect(projectService.setCurrentProject).toHaveBeenCalledWith(mockProject);
            expect(component.isImporting).toBeFalsy();
        }));

        it('should handle error when importing repository', fakeAsync(() => {
            const error = new Error('Import failed');
            githubImporterService.importRepository.mockReturnValue(throwError(() => error));

            component.selectRepository(mockRepo);
            tick();

            expect(component.error).toBe('Failed to import repository. Please try again.');
            expect(component.isImporting).toBeFalsy();
        }));
    });

    describe('modal interaction', () => {
        it('should emit modalClosed event when closeModal is called', () => {
            const emitSpy = jest.spyOn(component.modalClosed, 'emit');

            component.closeModal();

            expect(emitSpy).toHaveBeenCalled();
        });

        it.skip('should close modal on escape key', () => {
            const emitSpy = jest.spyOn(component.modalClosed, 'emit');
            const event = new KeyboardEvent('keydown', { key: 'Escape' });

            fixture.nativeElement.querySelector('.modal').dispatchEvent(event);
            fixture.detectChanges();

            expect(emitSpy).toHaveBeenCalled();
        });

        it.skip('should close modal on enter key', () => {
            const emitSpy = jest.spyOn(component.modalClosed, 'emit');
            const event = new KeyboardEvent('keydown', { key: 'Enter' });

            fixture.nativeElement.querySelector('.modal').dispatchEvent(event);
            fixture.detectChanges();

            expect(emitSpy).toHaveBeenCalled();
        });
    });
}); 