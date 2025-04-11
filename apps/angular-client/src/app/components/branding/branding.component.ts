import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="text-white font-bold m-3">{{title}}</div>',
})
export class BrandingComponent {
  private _title = 'Doci';

  public get title(): string {
    return this._title;
  }
}
