import { Injectable } from '@angular/core';
import { Octokit } from '@octokit/rest';
import { GitHubAuthService } from './github-auth.service';
import { FlatProject, ProjectFile, GitHubContent, PARSABLE_EXTENSIONS, FILE_SIZE_LIMIT } from '@doci/shared';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Base64 } from 'js-base64';

@Injectable({
    providedIn: 'root'
})
export class GitHubImporterService {
    private octokit: Octokit | null = null;

    constructor(private githubAuthService: GitHubAuthService) {
        this.initOctokit();
        this.githubAuthService.isAuthenticated$.subscribe(isAuthenticated => {
            if (isAuthenticated) {
                this.initOctokit();
            } else {
                this.octokit = null;
            }
        });
    }

    private initOctokit(): void {
        const token = this.githubAuthService.getAccessToken();
        if (token) {
            this.octokit = new Octokit({ auth: token });
        }
    }

    importRepository(owner: string, repo: string): Observable<FlatProject> {
        if (!this.octokit) {
            throw new Error('GitHub client not initialized');
        }

        return from(this.getRepositoryFiles(owner, repo, '')).pipe(
            map(files => ({
                name: repo,
                path: `github:${owner}/${repo}`,
                files: files,
                totalFiles: files.length,
                parsableFiles: files.filter(f => f.content).length,
                lastImported: new Date()
            }))
        );
    }

    private async getRepositoryFiles(owner: string, repo: string, path: string): Promise<ProjectFile[]> {
        if (!this.octokit) {
            throw new Error('GitHub client not initialized');
        }

        const files: ProjectFile[] = [];
        const response = await this.octokit.repos.getContent({
            owner,
            repo,
            path
        });

        const contents = Array.isArray(response.data) ? response.data : [response.data];

        for (const item of contents) {
            if (this.shouldIgnore(item.name)) {
                continue;
            }

            if (item.type === 'dir') {
                const subFiles = await this.getRepositoryFiles(owner, repo, item.path);
                files.push(...subFiles);
            } else if (item.type === 'file') {
                const extension = this.getFileExtension(item.name);
                if (PARSABLE_EXTENSIONS.includes(extension)) {
                    try {
                        let content: string | undefined;
                        if (item.size <= FILE_SIZE_LIMIT) {
                            const fileResponse = await this.octokit.repos.getContent({
                                owner,
                                repo,
                                path: item.path
                            });

                            const fileData = fileResponse.data as GitHubContent;
                            if (fileData.content && fileData.encoding === 'base64') {
                                content = Base64.decode(fileData.content);
                            }
                        }

                        files.push({
                            name: item.name,
                            path: item.path,
                            content,
                            type: extension.substring(1)
                        });
                    } catch (error) {
                        console.error(`Error fetching file content for ${item.path}:`, error);
                    }
                }
            }
        }

        return files;
    }

    private shouldIgnore(name: string): boolean {
        // Add any GitHub-specific ignore patterns here if needed
        return false;
    }

    private getFileExtension(filename: string): string {
        const parts = filename.split('.');
        return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    }
} 