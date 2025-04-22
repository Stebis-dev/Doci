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
    template: `
        <div class="modal-overlay" (click)="closeModal()" (keydown.enter)="closeModal()" tabindex="0" role="button" aria-label="Close modal">
            <div class="modal-content" (click)="$event.stopPropagation()">
                <div class="modal-header">
                    <h2>Select GitHub Repository</h2>
                    <button class="close-button" (click)="closeModal()" (keydown.enter)="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="search-box">
                        <input type="text" 
                               [(ngModel)]="searchTerm" 
                               (ngModelChange)="filterRepos()"
                               placeholder="Search repositories...">
                    </div>
                    <div class="repo-list">
                        <div *ngFor="let repo of filteredRepos" 
                             class="repo-item"
                             (click)="selectRepository(repo)"
                             (keydown.enter)="selectRepository(repo)"
                             tabindex="0"
                             role="button"
                             [attr.aria-label]="'Select repository ' + repo.name">
                            <h3>{{ repo.name }}</h3>
                            <p>{{ repo.description || 'No description available' }}</p>
                        </div>
                        <div *ngIf="isLoading" class="loading">Loading repositories...</div>
                        <div *ngIf="error" class="error">{{ error }}</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .modal-content {
            background: var(--background-color);
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
        }

        .modal-header {
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
        }

        .close-button {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--text-color);
        }

        .modal-body {
            padding: 1rem;
            overflow-y: auto;
        }

        .search-box {
            margin-bottom: 1rem;
        }

        .search-box input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: var(--input-background);
            color: var(--text-color);
        }

        .repo-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .repo-item {
            padding: 1rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .repo-item:hover {
            background: var(--hover-color);
        }

        .repo-item h3 {
            margin: 0 0 0.5rem 0;
        }

        .repo-item p {
            margin: 0;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .loading, .error {
            text-align: center;
            padding: 1rem;
        }

        .error {
            color: var(--error-color);
        }
    `]
})
export class GitHubRepoModalComponent implements OnInit {
    @Output() modalClosed = new EventEmitter<void>();
    repos: GitHubRepo[] = [];
    filteredRepos: GitHubRepo[] = [];
    searchTerm = '';
    isLoading = false;
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
        this.isLoading = true;
        this.error = null;

        this.githubImporterService.importRepository(repo.owner.login, repo.name).subscribe({
            next: (project) => {
                this.projectService.setCurrentProject(project);
                this.closeModal();
            },
            error: (error) => {
                this.error = 'Failed to import repository. Please try again.';
                this.isLoading = false;
                console.error('Error importing repository:', error);
            }
        });
    }

    closeModal(): void {
        this.modalClosed.emit();
    }
} 