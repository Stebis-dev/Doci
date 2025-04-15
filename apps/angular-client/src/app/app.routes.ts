import { Route } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { GitHubCallbackComponent } from './components/auth/github-callback.component';

export const appRoutes: Route[] = [
    {
        path: '',
        component: MainLayoutComponent,
    },
    {
        path: 'auth/github/callback',
        component: GitHubCallbackComponent
    },
];
