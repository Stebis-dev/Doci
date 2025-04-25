import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassDetail, ExtractorType, MethodDetail, ProjectFile } from '@doci/shared';
import { FileTreeSelection } from '../file-tree/file-tree.types';

@Component({
    selector: 'app-method-details',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './method-details.component.html',
})
export class MethodDetailsComponent implements OnInit, OnChanges {

    @Input() file: ProjectFile | null = null;
    @Input() selectedNode: FileTreeSelection | null = null;

    classDetail: ClassDetail | null = null;
    methods: MethodDetail | null = null;

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
        console.log('MethodDetailsComponent - ngOnChanges', this.file, this.selectedNode);
    }

    private updateFileDetails() {
        if (this.file?.details) {
            const className = this.selectedNode?.className || '';
            const methodName = this.selectedNode?.methodName || '';

            this.classDetail = this.file.details[ExtractorType.Class]?.filter(c => c.name === className)[0] || null;
            this.methods = this.classDetail?.methods.filter(c => c.name === methodName)[0] || null;;
        }
    }

    getFileName(): string {
        return this.file?.name || '';
    }

    getClassName(): string {
        return this.classDetail?.name || '';
    }

}