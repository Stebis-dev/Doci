import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TitleBarComponent } from "../components/titlebar/titlebar.component";
import { GitHubAuthService } from '../service/github/github-auth.service';
import { GitHubService } from '../service/github/github.service';
import { FileTreeComponent } from '../components/file-tree/file-tree.component';
import { CodeParserComponent } from "../components/code-parser/code-parser.component";

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, TitleBarComponent, FileTreeComponent, CodeParserComponent],
    providers: [GitHubAuthService, GitHubService],
    template: `
        <div class="layout-container">
            <app-titlebar></app-titlebar>
            <div class="content-container">
                <div class="sidebar">
                    <app-file-tree></app-file-tree>
                </div>
                <div class="main-content">
                    <app-code-parser></app-code-parser>
                    <router-outlet></router-outlet>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .layout-container {
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .content-container {
            flex: 1;
            display: flex;
            overflow: hidden;
        }

        .sidebar {
            width: 250px;
            border-right: 1px solid var(--border-color);
            overflow-y: auto;
            background: var(--background-color);
        }

        .main-content {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
        }
    `]
})
export class MainLayoutComponent {
}