import { Component, Input } from '@angular/core';
import { ConstructorMethodDetail, ParameterDetail } from '@doci/shared';

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

    getConstructorMethodName(method: ConstructorMethodDetail): string {
        let methodName = '';

        if (!method) {
            return '';
        }
        methodName = method.name;

        methodName += '(';
        if (method.parameters) {
            methodName += method.parameters.map(param => this.getParameter(param)).join(', ');
        }
        methodName += ')';
        return methodName
    }

    getParameter(parameter: ParameterDetail): string {
        let parameterType = '';

        if (parameter.genericName.length > 0)
            parameterType += parameter.genericName[0] + '<';

        if (parameter.objectType.length > 0)
            parameterType += parameter.objectType[0];

        if (parameter.genericName.length > 0)
            parameterType += '>';

        return `${parameterType} ${parameter.varName[0]}`;
    }
} 