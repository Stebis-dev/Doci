import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GitHubAuthService } from './github-auth.service';
import { ENVIRONMENT, GitHubRepo, GitHubRepoMapper } from '@doci/shared';

@Injectable({
    providedIn: 'root'
})
export class GitHubService {
    private apiUrl = ENVIRONMENT.github.apiUrl;

    constructor(
        private http: HttpClient,
        private githubAuthService: GitHubAuthService
    ) { }

    getUserRepositories(): Observable<GitHubRepo[]> {
        return this.getWithAuth<any[]>(`${this.apiUrl}/user/repos`).pipe(
            map(repos => repos.map(repo => GitHubRepoMapper.toDto(repo)))
        );
    }

    getRepositoryContents(owner: string, repo: string, path: string): Observable<any[]> {
        return this.getWithAuth(`${this.apiUrl}/repos/${owner}/${repo}/contents/${path}`);
    }

    getFileContent(owner: string, repo: string, path: string): Observable<any> {
        return this.getWithAuth(`${this.apiUrl}/repos/${owner}/${repo}/contents/${path}`);
    }

    private getWithAuth<T>(url: string): Observable<T> {
        const token = this.githubAuthService.getAccessToken();

        if (!token) {
            return of([] as unknown as T);
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        });

        return this.http.get<T>(url, { headers }).pipe(
            catchError(error => {
                console.error('GitHub API error:', error);
                return of([] as unknown as T);
            })
        );
    }
} 