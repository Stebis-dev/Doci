import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TitleBarComponent } from "../components/titlebar/titlebar.component";
import { GitHubAuthService } from '../service/github-auth.service';
import { GitHubService } from '../service/github.service';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, TitleBarComponent],
    providers: [GitHubAuthService, GitHubService],
    template: `
    <app-titlebar></app-titlebar>
    <div>Hello</div>
    <router-outlet></router-outlet>`,
})
export class MainLayoutComponent {
}