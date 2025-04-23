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
        if (method.returnType)
            return method.returnType;
        return ''
    }
    // getModifierString(): string {
    //     if (this.methods)
    //         return this.methods.modifiers.filter(modifier => modifier !== 'private' && modifier !== 'public').join(' ');

    //     return '';
    // }

} 