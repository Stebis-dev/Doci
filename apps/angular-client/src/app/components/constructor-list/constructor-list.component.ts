import { Component, Input } from '@angular/core';
import { ConstructorMethodDetail } from '@doci/shared';

@Component({
    selector: 'app-constructor-list',
    templateUrl: './constructor-list.component.html'
})
export class ConstructorListComponent {
    @Input() constructorLabel = 'Constructor';
    @Input() constructors: ConstructorMethodDetail[] | undefined = [];

    showConstructors(): boolean {
        return this.constructors !== undefined && this.constructors.length > 0;
    }
} 