import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassDetail, ExtractorType, MethodDetail, ParameterDetail, ProjectFile } from '@doci/shared';
import { FileTreeSelection } from '../file-tree/file-tree.types';
import { MethodGraphComponent } from '../method-graph/method-graph.component';
import { DescriptionComponent } from '../description/description.component';
import { ProjectService } from '../../service/project.service';

@Component({
    selector: 'app-method-details',
    standalone: true,
    imports: [CommonModule, MethodGraphComponent, DescriptionComponent],
    templateUrl: './method-details.component.html',
})
export class MethodDetailsComponent implements OnInit, OnChanges {

    @Input() file: ProjectFile | null = null;
    @Input() selectedNode: FileTreeSelection | null = null;

    classDetail: ClassDetail | null = null;
    method: MethodDetail | null = null;

    constructor(private readonly projectService: ProjectService) {
        //
    }

    ngOnInit() {
        this.updateFileDetails();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['file'] || changes['selectedNode']) {
            this.updateFileDetails();
        }
    }

    private updateFileDetails() {
        if (this.file?.details) {
            const className = this.selectedNode?.className || '';
            const methodName = this.selectedNode?.methodName || '';

            this.classDetail = this.file.details[ExtractorType.Class]?.filter(c => c.name === className)[0] || null;
            this.method = this.classDetail?.methods.filter(c => c.name === methodName)[0] || null;
        }
    }

    getFileName(): string {
        return this.file?.name || '';
    }

    getClassName(): string {
        return this.classDetail?.name || '';
    }

    getMethodName(): string {
        if (this.method) {
            return this.method.name;
        }
        return '';
    }

    getModifiers(): string[] {
        if (this.method) {
            return this.method.modifiers || [];
        }
        return [];
    }

    getReturnType(): string {
        let propertyType = '';
        if (!this.method) {
            return propertyType;
        }

        if (this.method.genericName)
            propertyType = this.method.genericName + '<';

        if (this.method.predefinedType)
            propertyType += this.method.predefinedType.join('');

        if (this.method.objectType)
            propertyType += this.method.objectType.join('');

        if (this.method.genericName)
            propertyType += '>';

        return propertyType;
    }

    getFullMethodName(): string {
        let methodName = '';

        if (!this.method) {
            return '';
        }
        methodName = this.method.name;

        methodName += '(';
        if (this.method.parameters) {
            methodName += this.method.parameters.map(param => this.getParameter(param)).join(', ');
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

    getParameters() {
        return this.method?.parameters;
    }

    showParameters(): boolean {
        return this.method?.parameters !== undefined && this.method?.parameters.length > 0;
    }

    getObjectType(parameter: ParameterDetail): string {
        let objectType = '';
        if (!this.method) {
            return objectType;
        }

        if (parameter.genericName.length > 0)
            objectType += parameter.genericName[0] + '<';

        if (parameter.objectType.length > 0)
            objectType += parameter.objectType[0];

        if (parameter.genericName.length > 0)
            objectType += '>';

        return objectType;
    }
    getVariableName(parameter: ParameterDetail): string {
        let variableName = '';
        if (!this.method) {
            return variableName;
        }

        if (parameter.varName.length > 0)
            variableName += parameter.varName[0];

        return variableName;
    }

    getDescription(): string {
        if (this.method) {
            return this.method.comment || '';
        }
        return '';
    }

    getMethodUuid(): string {
        return this.method?.uuid || '';
    }

    onSaveDescription(description?: string): void {
        if (description && this.method) {
            // Update the method's comment
            this.method.comment = description;

            // Update the method in the current project
            this.updateMethodInProject();
        }
    }

    onCancelDescriptionEdit(): void {
        // No additional cleanup needed for method descriptions
    }

    private updateMethodInProject(): void {
        if (!this.method || !this.file || !this.classDetail) return;

        const currentProject = this.projectService.getCurrentProject();
        if (!currentProject) return;

        // Find the file in the current project
        const fileIndex = currentProject.files.findIndex(f => f.uuid === this.file?.uuid);
        if (fileIndex === -1) return;

        // Find the class in the file
        const classIndex = currentProject.files[fileIndex].details?.[ExtractorType.Class]?.findIndex(
            c => c.uuid === this.classDetail?.uuid
        );

        if (classIndex !== undefined && classIndex !== -1) {
            // Find the method in the class
            const methodIndex = currentProject.files[fileIndex].details![ExtractorType.Class]![classIndex].methods.findIndex(
                m => m.uuid === this.method?.uuid
            );

            if (methodIndex !== -1) {
                // Update the method comment
                currentProject.files[fileIndex].details![ExtractorType.Class]![classIndex].methods[methodIndex].comment = this.method!.comment;

                // Update the project in the service
                this.projectService.updateCurrentProject(currentProject);
            }
        }
    }
}