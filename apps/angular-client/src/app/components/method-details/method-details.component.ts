import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassDetail, ExtractorType, MethodDetail, ProjectFile } from '@doci/shared';
import { FileTreeSelection } from '../file-tree/file-tree.types';
import { MethodGraphComponent } from '../method-graph/method-graph.component';

@Component({
    selector: 'app-method-details',
    standalone: true,
    imports: [CommonModule, MethodGraphComponent],
    templateUrl: './method-details.component.html',
})
export class MethodDetailsComponent implements OnInit, OnChanges {

    @Input() file: ProjectFile | null = null;
    @Input() selectedNode: FileTreeSelection | null = null;

    classDetail: ClassDetail | null = null;
    method: MethodDetail | null = null;

    constructor() {
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
    getParameters() {
        return this.method?.parameters;
    }
}