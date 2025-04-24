import { Component, Input } from '@angular/core';
import { MethodDetail } from '@doci/shared';

@Component({
    selector: 'app-method-list',
    templateUrl: './method-list.component.html'
})
export class MethodListComponent {
    @Input() methodLabel = 'Methods';
    @Input() methods: MethodDetail[] | undefined = [];

    showMethods(): boolean {
        return this.methods !== undefined && this.methods.length > 0;
    }

    getReturnType(method: MethodDetail): string {
        let propertyType = '';
        if (!method) {
            return propertyType;
        }

        if (method.genericName)
            propertyType = method.genericName + '<';

        if (method.predefinedType)
            propertyType += method.predefinedType.join('');

        if (method.objectType)
            propertyType += method.objectType.join('');

        if (method.genericName)
            propertyType += '>';

        return propertyType;
    }

} 