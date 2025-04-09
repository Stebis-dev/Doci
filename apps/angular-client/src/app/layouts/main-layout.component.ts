import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImportComponent } from '../components/import.component';
import { TitleBarComponent } from "../components/titlebar/titlebar.component";

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, ImportComponent, TitleBarComponent],
    template: `
    <app-titlebar></app-titlebar>
    <div>Hello<app-import></app-import><router-outlet></router-outlet></div>`,
})
export class MainLayoutComponent {
}