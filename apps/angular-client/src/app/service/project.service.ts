import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { FileSystemService } from './fileSystem.service';
import { FlatProject } from '@doci/shared';

@Injectable({
    providedIn: 'root'
})

export class ProjectService {

    private currentProjectSubject = new BehaviorSubject<FlatProject | null>(null);

    public currentProject$ = this.currentProjectSubject.asObservable();

    constructor(
        private fileSystemService: FileSystemService,
    ) { }

    public async selectLocalProject(): Promise<void> {
        try {
            const result = await this.fileSystemService.openDirectoryPicker();

            if (result) {
                this.currentProjectSubject.next(result);
                console.log('Selected project', result);
            }
        } catch (error) {
            console.error('Error selecting directory:', error);
        }
    }
}