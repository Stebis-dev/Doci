import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { FileSystemService } from './fileSystem.service';
import { FlatProject } from '@doci/shared';
import { TreeSitterService } from './tree-sitter/tree-sitter.service';
import { extractDetails } from './query/extract-details';
import { Tree } from 'web-tree-sitter';
import { resolveInheritance } from './query/inheritance-resolver';
import { resolveMethodUsages } from './query/method-usages-resolve';

const STORED_PROJECT_KEY = 'doci_current_project';

@Injectable({
    providedIn: 'root'
})

export class ProjectService {

    private readonly currentProjectSubject = new BehaviorSubject<FlatProject | null>(null);

    public currentProject$ = this.currentProjectSubject.asObservable();

    constructor(
        private readonly fileSystemService: FileSystemService,
        private readonly treeSitterService: TreeSitterService
    ) {
        this.loadStoredProject();
    }

    private async loadStoredProject(): Promise<void> {
        try {
            const storedProject = localStorage.getItem(STORED_PROJECT_KEY);
            if (storedProject) {
                const project = JSON.parse(storedProject) as FlatProject;
                console.log('Loading stored project:', project);
                this.currentProjectSubject.next(project);
                // this.setCurrentProject(project); // remove later
            }
        } catch (error) {
            console.error('Error loading stored project:', error);
        }
    }

    private saveProjectToStorage(project: FlatProject): void {
        try {
            localStorage.setItem(STORED_PROJECT_KEY, JSON.stringify(project));
        } catch (error) {
            console.error('Error saving project to storage:', error);
        }
    }

    public async selectLocalProject(): Promise<void> {
        try {
            const result = await this.fileSystemService.openDirectoryPicker();

            if (result) {
                this.setCurrentProject(result);
            }
        } catch (error) {
            console.error('Error selecting directory:', error);
        }
    }

    public async setCurrentProject(project: FlatProject): Promise<void> {
        // Convert files to AST
        const projectWithAST = await this.convertFilesToAST(project);
        const resolvedProject = resolveInheritance(projectWithAST);

        // Resolve method usage relationships
        const projectWithMethodUsages = resolveMethodUsages(resolvedProject);

        console.log('Setting current project:', projectWithMethodUsages);

        this.currentProjectSubject.next(projectWithMethodUsages);
        this.saveProjectToStorage(projectWithMethodUsages);
    }

    public clearStoredProject(): void {
        try {
            localStorage.removeItem(STORED_PROJECT_KEY);
            this.currentProjectSubject.next(null);
        } catch (error) {
            console.error('Error clearing stored project:', error);
        }
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
                            const details = extractDetails(file, ast as Tree, this.treeSitterService.getParser());
                            return {
                                ...file,
                                AST: ast || undefined,
                                details: details || undefined
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

    public getCurrentProject(): FlatProject | null {
        return this.currentProjectSubject.getValue();
    }
}