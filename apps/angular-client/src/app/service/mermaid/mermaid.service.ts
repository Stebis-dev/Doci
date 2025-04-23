import { Injectable } from '@angular/core';
import { ClassDetail, MethodDetail, ExtractedDetails } from '@doci/shared';
import { ProjectService } from '../project.service';

@Injectable({
    providedIn: 'root'
})
export class MermaidService {

    constructor(private readonly projectService: ProjectService) { }

    public generateClassDiagram(details: ExtractedDetails): string {
        if (!details || !details.classes || details.classes.length === 0) {
            return '';
        }

        const lines: string[] = [
            'classDiagram',
        ];

        // Get the current project
        const currentProject = this.projectService.getCurrentProject();
        const classMap = new Map<string, ClassDetail>();

        // Populate the class map for quick lookup
        if (currentProject) {
            currentProject.files.forEach(file => {
                if (file.details && file.details.classes) {
                    file.details.classes.forEach(cls => {
                        classMap.set(cls.name, cls);
                    });
                }
            });
        }

        details.classes.forEach(classDetail => {
            // Add class declaration
            this.buildClass(lines, classDetail);

            // Add inheritance relationships
            if (classDetail.parentClasses) {
                classDetail.parentClasses.forEach((parentName: string) => {

                    const parentClass = classMap.get(parentName);
                    if (parentClass) {
                        lines.push(`${parentName} <|-- ${classDetail.name}`);
                        this.buildClass(lines, parentClass);
                    }
                });
            }
        });
        const buildScript = lines.join('\n');
        console.log(buildScript);
        return buildScript;
    }

    private buildClass(lines: string[], classDetail: ClassDetail) {
        lines.push(this.generateClassDeclaration(classDetail) + '{');
        // lines.push('<<Abstract>>');

        const annotations = this.getAnnotations(classDetail.modifiers);
        if (annotations) {
            lines.push(annotations);
        }

        // Add properties
        if (classDetail.properties && classDetail.properties.length > 0) {
            classDetail.properties.forEach(prop => {
                lines.push(`\t${this.getModifierString(prop.modifiers)} ${prop.name} : ${prop.type}`);
            });
        }

        // Add constructors
        if (classDetail.constructor && classDetail.constructor.length > 0) {
            classDetail.constructor.forEach(ctor => {
                const params = this.formatMethodParameters(ctor);
                lines.push(`\t${this.getModifierString(ctor.modifiers)} ${ctor.name}(${params})`);
            });
        }

        // Add methods
        if (classDetail.methods && classDetail.methods.length > 0) {
            classDetail.methods.forEach(method => {
                const params = this.formatMethodParameters(method);
                lines.push(`\t${this.getModifierString(method.modifiers)} ${method.name}(${params}) ${this.getReturnType(method.returnType)}`);
            });
        }
        lines.push('}');
    }

    getReturnType(returnType: string | undefined) {
        let modifiedReturnType = '';
        if (returnType && returnType != 'void') {
            modifiedReturnType = returnType;
        }
        // console.log(modifiedReturnType);
        return modifiedReturnType;
    }

    private getModifierString(modifiers: string[]): string {
        for (const mod of modifiers) {
            switch (mod) {
                case 'public':
                    return '+';
                case 'private':
                    return '-';
                case 'protected':
                    return '#';
                default:
                    return '';
            }
        }
        return '';
    }

    private getAnnotations(annotations: string[]): string {
        // console.log(annotations);
        for (const anno of annotations) {
            switch (anno) {
                case 'abstract':
                    return '<<abstract>>';
            }
        }
        return '';
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