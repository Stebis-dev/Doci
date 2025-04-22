import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../service/project.service';
import { ProjectFile } from '@doci/shared';

interface TreeNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: TreeNode[];
    isExpanded?: boolean;
    file?: ProjectFile;
}

@Component({
    selector: 'app-file-tree',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="file-tree">
            @if (treeData.length > 0) {
                <div class="tree-container">
                    @for (node of treeData; track node.path) {
                        <ng-container *ngTemplateOutlet="treeNode; context: { $implicit: node }"></ng-container>
                    }
                </div>
            } @else {
                <div class="no-files">No project selected</div>
            }
        </div>

        <ng-template #treeNode let-node>
            <div class="tree-node">
                <div class="node-content" 
                     [class.file]="node.type === 'file'"
                     [class.directory]="node.type === 'directory'"
                     [class.expanded]="node.isExpanded"
                     (click)="toggleNode(node)"
                     role="button"
                     tabindex="0"
                     (keydown.enter)="toggleNode(node)">
                    <span class="node-icon">
                        @if (node.type === 'directory') {
                            {{ node.isExpanded ? '📂' : '📁' }}
                        } @else {
                            📄
                        }
                    </span>
                    <span class="node-name">{{ node.name }}</span>
                </div>
                @if (node.type === 'directory' && node.isExpanded && node.children) {
                    <div class="node-children">
                        @for (child of node.children; track child.path) {
                            <ng-container *ngTemplateOutlet="treeNode; context: { $implicit: child }"></ng-container>
                        }
                    </div>
                }
            </div>
        </ng-template>
    `,
    styles: [`
        .file-tree {
            padding: 1rem;
            background: var(--background-color);
            color: var(--text-color);
            height: 100%;
            overflow-y: auto;
        }

        .tree-container {
            font-family: monospace;
        }

        .no-files {
            color: var(--text-secondary);
            text-align: center;
            padding: 1rem;
        }

        .tree-node {
            margin-left: 0.5rem;
        }

        .node-content {
            display: flex;
            align-items: center;
            padding: 0.25rem;
            cursor: pointer;
            border-radius: 4px;
            user-select: none;
        }

        .node-content:hover {
            background: var(--hover-color);
        }

        .node-content:focus {
            outline: none;
            background: var(--hover-color);
        }

        .node-icon {
            margin-right: 0.5rem;
            width: 1.5rem;
        }

        .node-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .node-children {
            border-left: 1px solid var(--border-color);
        }

        .file {
            margin-left: 0rem;
        }
    `]
})
export class FileTreeComponent implements OnInit {
    treeData: TreeNode[] = [];
    @Output() nodeSelected = new EventEmitter<ProjectFile>();

    constructor(private projectService: ProjectService) { }

    ngOnInit() {
        this.projectService.currentProject$.subscribe(project => {
            if (project) {
                this.treeData = this.buildTreeFromFiles(project.files);
            } else {
                this.treeData = [];
            }
        });
    }

    private buildTreeFromFiles(files: ProjectFile[]): TreeNode[] {
        const root: { [key: string]: TreeNode } = {};

        // Sort files to ensure directories come before their contents
        const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

        for (const file of sortedFiles) {
            const parts = file.path.split(/[/\\]/);
            const currentLevel = root;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const currentPath = parts.slice(0, i + 1).join('/');
                const isLastPart = i === parts.length - 1;

                if (!currentLevel[currentPath]) {
                    currentLevel[currentPath] = {
                        name: part,
                        path: currentPath,
                        type: isLastPart ? 'file' : 'directory',
                        children: isLastPart ? undefined : [],
                        isExpanded: false,
                        file: isLastPart ? file : undefined
                    };

                    const parentPath = parts.slice(0, i).join('/');
                    if (i > 0 && currentLevel[parentPath]?.children) {
                        currentLevel[parentPath].children?.push(currentLevel[currentPath]);
                    }
                }
            }
        }

        // Return only top-level nodes
        return Object.values(root).filter(node => !node.path.includes('/'));
    }

    toggleNode(node: TreeNode): void {
        if (node.type === 'directory') {
            node.isExpanded = !node.isExpanded;
        } else if (node.file) {
            this.nodeSelected.emit(node.file);
        }
    }
} 