import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileTreeComponent } from '../../components/file-tree/file-tree.component';
import { ClassDetailsComponent } from '../../components/class-details/class-details.component';
import { ProjectService } from '../../service/project.service';
import { ProjectFile } from '@doci/shared';
import { FileTreeSelection } from '../../components/file-tree/file-tree.types';
import { MethodDetailsComponent } from '../../components/method-details/method-details.component';

@Component({
    selector: 'app-project-explorer',
    standalone: true,
    imports: [CommonModule, FileTreeComponent, ClassDetailsComponent, MethodDetailsComponent],
    templateUrl: './project-explorer.component.html'
})
export class ProjectExplorerComponent implements OnInit {
    selectedFile: ProjectFile | null = null;
    selectedNode: FileTreeSelection | null = null;

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
        // console.log('Selected node:', selection);

        this.selectedFile = selection.file;
        this.selectedNode = selection;
    }

    showClassDetails(): boolean {
        return this.selectedNode?.selectedType === 'class' || this.selectedNode?.selectedType === 'enum';
    }

    showMethodDetails(): boolean {
        return this.selectedNode?.selectedType === 'method';
    }
} 