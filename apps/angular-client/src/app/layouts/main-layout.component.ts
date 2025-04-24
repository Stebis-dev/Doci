import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TitleBarComponent } from "../components/titlebar/titlebar.component";
import { GitHubAuthService } from '../service/github/github-auth.service';
import { GitHubService } from '../service/github/github.service';
import { ProjectExplorerComponent } from '../pages/project-explorer/project-explorer.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [TitleBarComponent, ProjectExplorerComponent],
    providers: [GitHubAuthService, GitHubService],
    template: `
        <div class="h-screen flex flex-col overflow-hidden">
            <app-titlebar class="flex-none"></app-titlebar>
            <div class="flex-1 overflow-hidden">
                <app-project-explorer></app-project-explorer>
            </div>
        </div>
    `,
})
export class MainLayoutComponent {
}