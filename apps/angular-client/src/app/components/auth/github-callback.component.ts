import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GitHubAuthService } from '../../service/github/github-auth.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-github-callback',
    template: `
    <div class="flex items-center justify-center h-screen">
      <div class="text-center">
        <h1 class="text-xl font-bold mb-4">{{ message }}</h1>
        <p *ngIf="loading">Processing authentication, please wait...</p>
        <button *ngIf="!loading" (click)="close()" class="btn btn-outline">Close</button>
      </div>
    </div>
  `,
    standalone: true,
    imports: [CommonModule]
})
export class GitHubCallbackComponent implements OnInit {
    loading = true;
    message = 'Authenticating with GitHub...';

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly githubAuthService: GitHubAuthService
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const code = params['code'];

            if (!code) {
                this.loading = false;
                this.message = 'Authentication failed - missing parameters';
                return;
            }

            this.githubAuthService.handleCallback(code).subscribe({
                next: (credentials) => {
                    this.loading = false;
                    if (credentials) {
                        this.message = 'Authentication successful!';
                        setTimeout(() => this.close(), 1500);
                    } else {
                        this.message = 'Authentication failed';
                    }
                },
                error: (error) => {
                    this.loading = false;
                    this.message = `Authentication error: ${error.message || 'Unknown error'}`;
                }
            });
        });
    }

    close(): void {
        this.router.navigate(['/']);
    }
} 