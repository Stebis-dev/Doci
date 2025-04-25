import { Injectable } from '@angular/core';
import { ClassDetail, MethodDetail, PropertyDetail, EnumDetail } from '@doci/shared';
import { ProjectService } from '../project.service';

@Injectable({
    providedIn: 'root'
})
export class MermaidService {

    constructor(private readonly projectService: ProjectService) { }

    private classDiagramInitial(): string[] {
        const lines: string[] = [];
        lines.push('classDiagram');
        lines.push('direction BT');
        return lines;
    }

    private populateClassMap(): Map<string, ClassDetail> {
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
        return classMap;
    }

    private populateEnumMap(): Map<string, EnumDetail> {
        const currentProject = this.projectService.getCurrentProject();
        const enumMap = new Map<string, EnumDetail>();

        // Populate the enum map for quick lookup
        if (currentProject) {
            currentProject.files.forEach(file => {
                if (file.details && file.details.enums) {
                    file.details.enums.forEach(cls => {
                        enumMap.set(cls.name, cls);
                    });
                }
            });
        }
        return enumMap;
    }


    public generateClassDiagramFromClass(classObj: ClassDetail): string {
        if (!classObj)
            return '';

        const lines: string[] = this.classDiagramInitial()

        const classMap = this.populateClassMap();
        const enumMap = this.populateEnumMap();

        // Tracks classes and enums that have been processed to avoid duplicates
        const processedObjects = new Set<string>();

        this.processClassHierarchy(lines, classObj, classMap, enumMap, processedObjects);

        const buildScript = lines.join('\n');
        console.log({ buildScript });
        return buildScript;
    }

    public generateClassDiagramFromEnum(enumObj: EnumDetail): string {
        if (!enumObj)
            return '';

        const lines: string[] = this.classDiagramInitial()

        this.buildEnumClass(lines, enumObj);

        const buildScript = lines.join('\n');
        console.log({ buildScript });
        return buildScript;
    }

    private processClassHierarchy(lines: string[], classDetail: ClassDetail, classMap: Map<string, ClassDetail>, enumMap: Map<string, EnumDetail>, processedClasses: Set<string>) {
        if (processedClasses.has(classDetail.name)) {
            return;
        }
        processedClasses.add(classDetail.name);

        // Add class declaration
        this.buildClass(lines, classDetail);
        // Add inheritance relationships
        if (classDetail.inheritance) {
            classDetail.inheritance.forEach((parentName: string) => {
                const parentClass = classMap.get(parentName);
                if (parentClass) {
                    lines.push(`${parentName} <|-- ${classDetail.name}`);
                    this.processClassHierarchy(lines, parentClass, classMap, enumMap, processedClasses);
                }
            });
        }

        // Add object usage relationships
        if (classDetail.objectsUsed) {
            classDetail.objectsUsed.forEach((parentName: string) => {
                const parentClass = classMap.get(parentName);
                if (parentClass) {
                    lines.push(`${parentName} -- ${classDetail.name}`);
                    this.processClassHierarchy(lines, parentClass, classMap, enumMap, processedClasses);
                }
            });
        }

        if (classDetail.objectsUsed) {
            classDetail.objectsUsed.forEach((parentName: string) => {
                const parentEnum = enumMap.get(parentName);
                if (parentEnum) {
                    lines.push(`${parentName} -- ${classDetail.name}`);
                    if (processedClasses.has(parentEnum.name)) {
                        return;
                    }
                    processedClasses.add(parentEnum.name);
                    this.buildEnumClass(lines, parentEnum);
                    // this.processClassHierarchy(lines, parentClass, classMap, enumMap, processedClasses);
                }
            });
        }
    }

    private buildClass(lines: string[], classDetail: ClassDetail) {

        lines.push(this.generateClassDeclaration(classDetail.name) + '{');

        const annotations = this.getAnnotations(classDetail.modifiers);
        if (annotations) {
            lines.push(annotations);
        }

        // Add properties
        if (classDetail.properties && classDetail.properties.length > 0) {
            classDetail.properties.forEach(prop => {
                lines.push(this.buildProperty(prop));
            });
        }

        // Add constructors
        if (classDetail.constructors && classDetail.constructors.length > 0) {
            classDetail.constructors.forEach(ctor => {
                const params = this.formatMethodParameters(ctor.parameters);
                lines.push(`\t${this.getModifierString(ctor.modifiers)} ${ctor.name}(${params})`);
            });
        }

        // Add methods
        if (classDetail.methods && classDetail.methods.length > 0) {
            classDetail.methods.forEach(method => {
                const params = this.formatMethodParameters(method.parameters);
                lines.push(`\t${this.getModifierString(method.modifiers)} ${method.name}(${params}) ${this.getReturnType(method)}`);
            });
        }
        lines.push('}');

    }

    private buildEnumClass(lines: string[], enumDetail: EnumDetail) {

        lines.push(this.generateClassDeclaration(enumDetail.name) + '{');

        lines.push('<<enumeration>>');

        // Add properties
        if (enumDetail.members && enumDetail.members.length > 0) {
            enumDetail.members.forEach(member => {
                lines.push(member.member);
            });
        }
        lines.push('}');
    }

    buildProperty(property: PropertyDetail): string {
        let propertyType = ''

        if (property.genericName)
            propertyType += property.genericName + '< ';

        if (property.objectType[0])
            propertyType += property.objectType[0];

        if (property.predefinedType[0])
            propertyType += property.predefinedType[0];

        if (property.genericName)
            propertyType += ' >';

        return `\t${this.getModifierString(property.modifiers)} ${property.name} : ${propertyType}`;
    }

    getReturnType(returnType: MethodDetail) {
        let modifiedReturnType = '';

        if (returnType.predefinedType[0] == 'void')
            return modifiedReturnType

        if (returnType.genericName)
            modifiedReturnType += returnType.genericName + '< ';

        if (returnType.objectType[0])
            modifiedReturnType += returnType.objectType[0];

        if (returnType.predefinedType[0])
            modifiedReturnType += returnType.predefinedType[0];

        if (returnType.genericName)
            modifiedReturnType += ' >';

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

    private generateClassDeclaration(className: string): string {
        const declaration = `class ${className}`;
        return declaration;
    }

    private formatMethodParameters(parameters: { name: string; type: string | null }[]): string {
        if (!parameters || parameters.length === 0) {
            return '';
        }

        return parameters
            .map(param => {
                if (param.type) {
                    return `${param.name}: ${param.type}`;
                }
                return param.name;
            })
            .join(', ');
    }
} 