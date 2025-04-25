import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../service/project.service';
import { ProjectFile, ClassDetail, MethodDetail, EnumDetail } from '@doci/shared';
import { IconComponent } from '../icon.component';
import { TreeNode, FileTreeSelection, NodeType } from './file-tree.types';

@Component({
    selector: 'app-file-tree',
    standalone: true,
    imports: [CommonModule, IconComponent],
    templateUrl: './file-tree.component.html'
})
export class FileTreeComponent implements OnInit {
    treeData: TreeNode[] = [];
    @Output() nodeSelected = new EventEmitter<FileTreeSelection>();

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

            // Build directory structure
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const currentPath = parts.slice(0, i + 1).join('/');
                const isLastPart = i === parts.length - 1;

                if (!currentLevel[currentPath]) {
                    currentLevel[currentPath] = {
                        name: part,
                        path: currentPath,
                        type: isLastPart ? 'file' : 'directory',
                        children: isLastPart ? [] : [],
                        isExpanded: false,
                        file: isLastPart ? file : undefined
                    };

                    const parentPath = parts.slice(0, i).join('/');
                    if (i > 0 && currentLevel[parentPath]?.children) {
                        currentLevel[parentPath].children?.push(currentLevel[currentPath]);
                    }
                }

                // If this is a file node, add its classes, enums, and interfaces
                if (isLastPart && file.details) {
                    const fileNode = currentLevel[currentPath];

                    // Add classes
                    if (file.details.classes) {
                        file.details.classes.forEach(classDetail => {
                            const classNode = this.createClassNode(classDetail, file, 'class');
                            fileNode.children?.push(classNode);
                        });
                    }

                    // Add enums
                    if (file.details.enums) {
                        file.details.enums.forEach(enumDetail => {
                            const enumNode = this.createEnumNode(enumDetail, file, 'enum');
                            fileNode.children?.push(enumNode);
                        });
                    }
                }
            }
        }

        // Return only top-level nodes
        return Object.values(root).filter(node => !node.path.includes('/'));
    }

    private createClassNode(detail: ClassDetail, file: ProjectFile, type: 'class' | 'enum' | 'interface'): TreeNode {
        const classNode: TreeNode = {
            name: detail.name,
            path: `${file.path}#${detail.name}`,
            type: type,
            children: [],
            isExpanded: false,
            file: file,
            classType: type
        };

        // Add methods for classes
        if (type === 'class' && detail.methods) {
            detail.methods.forEach(method => {
                const methodNode: TreeNode = {
                    name: `${method.name}()`,
                    path: `${classNode.path}#${method.name}`,
                    type: 'method',
                    methodDetail: method,
                    file: file
                };
                classNode.children?.push(methodNode);
            });
        }

        return classNode;
    }

    private createEnumNode(detail: EnumDetail, file: ProjectFile, type: 'class' | 'enum' | 'interface'): TreeNode {
        const classNode: TreeNode = {
            name: detail.name,
            path: `${file.path}#${detail.name}`,
            type: type,
            children: [],
            isExpanded: false,
            file: file,
            classType: type
        };

        return classNode;
    }

    toggleNode(node: TreeNode): void {
        if (node.type === 'method') {
            // Emit method selection
            this.nodeSelected.emit({
                file: node.file!,
                selectedType: 'method',
                className: node.path.split('#')[1],
                methodName: node.name.replace('()', '')
            });
        } else if (node.type === 'class' || node.type === 'interface') {
            // Toggle expansion for class/interface nodes
            node.isExpanded = !node.isExpanded;
            // Emit class selection
            this.nodeSelected.emit({
                file: node.file!,
                selectedType: 'class',
                className: node.name
            });
        } else if (node.type === 'enum') {
            // Toggle expansion for file nodes
            node.isExpanded = !node.isExpanded;
            // Emit file selection
            this.nodeSelected.emit({
                file: node.file!,
                selectedType: 'enum',
                enumName: node.name
            });
        } else if (node.type === 'file') {
            // Toggle expansion for file nodes
            node.isExpanded = !node.isExpanded;
        } else if (node.type === 'directory') {
            // Toggle expansion for directory nodes
            node.isExpanded = !node.isExpanded;
        }
    }
} 