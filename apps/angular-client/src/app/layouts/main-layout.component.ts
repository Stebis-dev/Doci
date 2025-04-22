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
        <div class="layout-container">
            <app-titlebar></app-titlebar>
            <app-project-explorer class="h-full w-full flex flex-row"></app-project-explorer>
        </div>
    `,
    styles: [`
        .layout-container {
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
    `]
})
export class MainLayoutComponent {
}