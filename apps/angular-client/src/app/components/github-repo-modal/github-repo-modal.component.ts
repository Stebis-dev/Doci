import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GitHubService } from '../../service/github/github.service';
import { GitHubImporterService } from '../../service/github/github-importer.service';
import { ProjectService } from '../../service/project.service';
import { GitHubRepo } from '@doci/shared';

// TODO add normal ui with DaisyUi and tailwind 

@Component({
    selector: 'app-github-repo-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './github-repo-modal.component.html'
})
export class GitHubRepoModalComponent implements OnInit {
    @Output() modalClosed = new EventEmitter<void>();
    repos: GitHubRepo[] = [];
    filteredRepos: GitHubRepo[] = [];
    searchTerm = '';
    isLoading = false;
    isImporting = false;
    error: string | null = null;

    constructor(
        private githubService: GitHubService,
        private githubImporterService: GitHubImporterService,
        private projectService: ProjectService
    ) { }

    ngOnInit(): void {
        this.loadRepositories();
    }

    private loadRepositories(): void {
        this.isLoading = true;
        this.error = null;

        this.githubService.getUserRepositories().subscribe({
            next: (repos) => {
                this.repos = repos;
                this.filteredRepos = repos;
                this.isLoading = false;
            },
            error: (error) => {
                this.error = 'Failed to load repositories. Please try again.';
                this.isLoading = false;
                console.error('Error loading repositories:', error);
            }
        });
    }

    filterRepos(): void {
        const term = this.searchTerm.toLowerCase();
        this.filteredRepos = this.repos.filter(repo =>
            repo.name.toLowerCase().includes(term) ||
            (repo.description && repo.description.toLowerCase().includes(term))
        );
    }

    selectRepository(repo: GitHubRepo): void {
        this.isImporting = true;
        this.error = null;

        this.githubImporterService.importRepository(repo.owner.login, repo.name).subscribe({
            next: (project) => {
                this.projectService.setCurrentProject(project);
                this.closeModal();
            },
            error: (error) => {
                this.error = 'Failed to import repository. Please try again.';
                this.isImporting = false;
                console.error('Error importing repository:', error);
            }
        });
    }

    closeModal(): void {
        this.modalClosed.emit();
    }
} 