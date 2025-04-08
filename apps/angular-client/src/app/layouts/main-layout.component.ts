import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImportComponent } from '../components/import.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, ImportComponent],
    template: `<div>Hello<app-import></app-import><router-outlet></router-outlet></div>`,
})
export class MainLayoutComponent {
}