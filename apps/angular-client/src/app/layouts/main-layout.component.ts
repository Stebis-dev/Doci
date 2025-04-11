import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TitleBarComponent } from "../components/titlebar/titlebar.component";

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, TitleBarComponent],
    template: `
    <app-titlebar></app-titlebar>
    <div>Hello<router-outlet></router-outlet></div>`,
})
export class MainLayoutComponent {
}