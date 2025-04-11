import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SafeHtmlPipe } from '../core/pipes/safe-html.pipe';

@Component({
    selector: 'app-icon',
    standalone: true,
    imports: [SafeHtmlPipe],
    template: `<div [innerHTML]="currentSvg | safeHtml"></div> `,
    styles: [
        `
      svg {
        display: inline-block;
        vertical-align: middle;
      }
    `,
    ],
})
export class IconComponent implements OnChanges {
    @Input() name = 'default';
    @Input() size = '24px';
    @Input() color = 'currentColor';

    currentSvg = '';

    icons: { [key: string]: string } = {
        Square: `
        <svg xmlns="http://www.w3.org/2000/svg" width="size" height="size" fill="currentColor" class="bi bi-square" viewBox="0 0 16 16">
            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
        </svg>`,
        X_lg: `
        <svg xmlns="http://www.w3.org/2000/svg" width="size" height="size" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
        </svg>`,
        Dash_lg: `
        <svg xmlns="http://www.w3.org/2000/svg" width="size" height="size" fill="currentColor" class="bi bi-dash-lg" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8"/>
        </svg>`,
        Window_stack: `
        <svg xmlns="http://www.w3.org/2000/svg" width="size" height="size" fill="currentColor" class="bi bi-window-stack" viewBox="0 0 16 16">
            <path d="M4.5 6a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M6 6a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m2-.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"/>
            <path d="M12 1a2 2 0 0 1 2 2 2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2 2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zM2 12V5a2 2 0 0 1 2-2h9a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1m1-4v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8zm12-1V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v2z"/>
        </svg>`,
        Square_fill: `
        <svg xmlns="http://www.w3.org/2000/svg" width="size" height="size" fill="currentColor" class="bi bi-square-fill" viewBox="0 0 16 16">
            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2z"/>
        </svg>`,
        default: `<div class = "bg-[red] text-white" > ERROR </div>`,
    };

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['name']) {
            this.updateSvg();
        }
    }

    updateSvg(): void {
        const tempSvg = this.icons[this.name] || this.icons['default'];

        if (tempSvg === undefined) {
            console.error(`Icon "${this.name}" not found.`);
            return;
        }

        this.currentSvg = tempSvg.replace(/size/g, `${this.size} `).replace(/currentColor/g, `${this.color} `);
    }
}