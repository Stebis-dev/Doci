import { Injectable } from '@angular/core';
import { ClassDetail, MethodDetail, ExtractedDetails } from '@doci/shared';

@Injectable({
    providedIn: 'root'
})
export class MermaidService {

    public generateClassDiagram(details: ExtractedDetails): string {
        if (!details || !details.classes || details.classes.length === 0) {
            return '';
        }

        const lines: string[] = [
            'classDiagram',
        ];

        details.classes.forEach(classDetail => {
            // Add class declaration
            lines.push(this.generateClassDeclaration(classDetail) + '{');

            // Add properties
            if (classDetail.properties && classDetail.properties.length > 0) {
                classDetail.properties.forEach(prop => {
                    lines.push(`\t${prop.name}`);
                });
            }

            // Add constructors
            if (classDetail.constructor && classDetail.constructor.length > 0) {
                classDetail.constructor.forEach(ctor => {
                    const params = this.formatMethodParameters(ctor);
                    lines.push(`\t${ctor.name}(${params})`);
                });
            }

            // Add methods
            if (classDetail.methods && classDetail.methods.length > 0) {
                classDetail.methods.forEach(method => {
                    const params = this.formatMethodParameters(method);
                    lines.push(`\t${method.name}(${params})`);
                });
            }
            lines.push('}');
        });
        const buildScript = lines.join('\n');
        console.log(buildScript);
        return buildScript;
    }

    private generateClassDeclaration(classDetail: ClassDetail): string {
        const declaration = `class ${classDetail.name}`;
        return declaration;
    }

    private formatMethodParameters(method: MethodDetail): string {
        if (!method.parameters || method.parameters.length === 0) {
            return '';
        }

        return method.parameters
            .map(param => {
                if (param.type) {
                    return `${param.name}: ${param.type}`;
                }
                return param.name;
            })
            .join(', ');
    }
} 