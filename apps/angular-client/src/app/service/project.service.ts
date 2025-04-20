import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { FileSystemService } from './fileSystem.service';
import { FlatProject, ProjectFile } from '@doci/shared';
import { TreeSitterService } from './tree-sitter/tree-sitter.service';

@Injectable({
    providedIn: 'root'
})

export class ProjectService {

    private currentProjectSubject = new BehaviorSubject<FlatProject | null>(null);

    public currentProject$ = this.currentProjectSubject.asObservable();

    constructor(
        private fileSystemService: FileSystemService,
        private treeSitterService: TreeSitterService,
    ) { }

    public async selectLocalProject(): Promise<void> {
        try {
            const result = await this.fileSystemService.openDirectoryPicker();

            if (result) {
                // Convert files to AST
                const projectWithAST = await this.convertFilesToAST(result);
                this.currentProjectSubject.next(projectWithAST);
                console.log('Selected project with AST', projectWithAST);
            }
        } catch (error) {
            console.error('Error selecting directory:', error);
        }
    }

    public async setCurrentProject(project: FlatProject): Promise<void> {
        const projectWithAST = await this.convertFilesToAST(project);
        console.log('Setting current project with AST:', projectWithAST);
        this.currentProjectSubject.next(projectWithAST);
    }

    private async convertFilesToAST(project: FlatProject): Promise<FlatProject> {
        try {
            await this.treeSitterService.initialize();

            const filesWithAST = await Promise.all(
                project.files.map(async (file) => {
                    if (file.content && file.type) {
                        try {
                            await this.treeSitterService.setLanguage(file.type);
                            const ast = await this.treeSitterService.parse(file.content);
                            return {
                                ...file,
                                AST: ast || undefined
                            };
                        } catch (error) {
                            console.warn(`Failed to parse AST for file ${file.path}:`, error);
                            return file;
                        }
                    }
                    return file;
                })
            );

            return {
                ...project,
                files: filesWithAST
            };
        } catch (error) {
            console.error('Error converting files to AST:', error);
            return project;
        }
    }
}