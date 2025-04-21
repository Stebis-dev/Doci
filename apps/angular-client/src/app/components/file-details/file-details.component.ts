import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectFile } from '@doci/shared';
import { ExtractorType } from '../../service/query/extractor/base-query.engine';

@Component({
    selector: 'app-file-details',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './file-details.component.html',
})
export class FileDetailsComponent implements OnInit, OnChanges {
    @Input() file: ProjectFile | null = null;
    activeTab: 'classes' | 'methods' | 'enums' = 'classes';
    ExtractorType = ExtractorType;

    ngOnInit() {
        console.log('FileDetailsComponent initialized');
    }

    ngOnChanges() {
        console.log('File details changed:', this.file);
        if (this.file?.details) {
            console.log('File details:', this.file.details);
        }
    }
} 