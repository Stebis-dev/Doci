import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileTreeComponent } from '../../components/file-tree/file-tree.component';
import { FileDetailsComponent } from '../../components/file-details/file-details.component';
import { ProjectService } from '../../service/project.service';
import { ProjectFile } from '@doci/shared';
import { FileTreeSelection } from '../../components/file-tree/file-tree.types';

@Component({
    selector: 'app-project-explorer',
    standalone: true,
    imports: [CommonModule, FileTreeComponent, FileDetailsComponent],
    template: `
        <div class="flex h-full w-full overflow-hidden">
            <div class="w-1/4 min-w-[250px] max-w-[300px] h-full overflow-hidden border-base-300">
                <app-file-tree (nodeSelected)="handleSelection($event)"></app-file-tree>
            </div>
            <div class="flex-1 h-full overflow-auto border-l border-base-300">
                <app-file-details [file]="selectedFile"></app-file-details>
            </div>
        </div>
    `,
})
export class ProjectExplorerComponent implements OnInit {
    selectedFile: ProjectFile | null = null;

    constructor(private projectService: ProjectService) { }

    ngOnInit() {
        // Subscribe to project changes if needed
        this.projectService.currentProject$.subscribe(project => {
            if (!project) {
                this.selectedFile = null;
            }
        });
    }

    onFileSelected(file: ProjectFile) {
        console.log('Selected file:', file);
        this.selectedFile = file;
    }

    handleSelection(selection: FileTreeSelection) {
        console.log('Selected node:', selection);
        switch (selection.selectedType) {
            case 'class':
                this.selectedFile = selection.file;
                // Show class details
                // selection.className available
                break;
            case 'method':
                this.selectedFile = selection.file;
                // Show method details
                // selection.className and selection.methodName available
                break;
        }
    }
} 