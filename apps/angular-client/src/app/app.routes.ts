import { Route } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout.component';

export const appRoutes: Route[] = [
    {
        path: '',
        component: MainLayoutComponent,
    },
    {
        path: 'github',
        loadChildren: () => import('./components/github/github.module').then(m => m.GitHubModule)
    }
];
