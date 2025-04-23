import { Component, Input } from '@angular/core';
import { PropertyDetail } from '@doci/shared';

@Component({
    selector: 'app-property-list',
    templateUrl: './property-list.component.html'
})
export class PropertyListComponent {
    @Input() propertyLabel = 'Properties';
    @Input() properties: PropertyDetail[] | undefined = [];

    showProperties(): boolean {
        return this.properties !== undefined && this.properties.length > 0;
    }
} 