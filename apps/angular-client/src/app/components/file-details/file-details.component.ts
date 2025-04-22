import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassDetail, ConstructorMethodDetail, ExtractorType, MethodDetail, ProjectFile } from '@doci/shared';

@Component({
    selector: 'app-file-details',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './file-details.component.html',
})
export class FileDetailsComponent implements OnInit, OnChanges {
    @Input() file: ProjectFile | null = null;
    activeTab: 'classes' | 'methods' | 'enums' = 'classes';

    classes?: ClassDetail[] = [];
    constructors?: ConstructorMethodDetail[] = [];
    methods?: MethodDetail[] = [];
    properties?: { name: string }[] = [];

    ngOnInit() {
        console.log('FileDetailsComponent initialized');
    }

    ngOnChanges() {
        // console.log('File details changed:', this.file);
        if (this.file?.details) {
            console.log('File details:', this.file.details);
            this.classes = this.file.details[ExtractorType.Class];
            if (this.classes && this.classes.length > 0) {
                this.constructors = this.classes[0].constructor;
                this.methods = this.classes[0].methods;
                this.properties = this.classes[0].properties;
            }
        }
        // console.log('Classes:', this.classes);
        // console.log('Constructors:', this.constructors);
        // console.log('Methods:', this.methods);
        // console.log('Properties:', this.properties);
    }

    getFileName(): string {
        return this.file?.name || '';
    }
    showClasses(): boolean {
        return this.classes !== undefined && this.classes.length > 0;
    }
    showProperties(): boolean {
        return this.properties !== undefined && this.properties.length > 0;
    }
    showConstructors(): boolean {
        return this.constructors !== undefined && this.constructors.length > 0;
    }
    showMethods(): boolean {
        return this.methods !== undefined && this.methods.length > 0;
    }
} 