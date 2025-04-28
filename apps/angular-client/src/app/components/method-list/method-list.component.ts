import { Component, Input } from '@angular/core';
import { MethodDetail, ParameterDetail } from '@doci/shared';

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
    getMethodName(method: MethodDetail): string {
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