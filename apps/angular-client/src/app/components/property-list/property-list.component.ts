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

    getPropertyType(property: PropertyDetail) {
        let propertyType = '';
        if (!property) {
            return propertyType;
        }

        if (property.genericName)
            propertyType = property.genericName + '<';

        if (property.predefinedType)
            propertyType += property.predefinedType.join('');

        if (property.objectType)
            propertyType += property.objectType.join('');

        if (property.genericName)
            propertyType += '>';

        return propertyType;
    }
} 