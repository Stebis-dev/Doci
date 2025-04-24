import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileTreeComponent } from '../../components/file-tree/file-tree.component';
import { FileDetailsComponent } from '../../components/file-details/file-details.component';
import { ProjectService } from '../../service/project.service';
import { ProjectFile } from '@doci/shared';

@Component({
    selector: 'app-project-explorer',
    standalone: true,
    imports: [CommonModule, FileTreeComponent, FileDetailsComponent],
    template: `
        <div class="flex h-full w-full">
            <div class="flex-1 border-r border-base-300">
                <app-file-tree (nodeSelected)="onFileSelected($event)"></app-file-tree>
            </div>
            <div class="flex-10/12 items-center justify-center border-l border-base-300 ">
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
} 