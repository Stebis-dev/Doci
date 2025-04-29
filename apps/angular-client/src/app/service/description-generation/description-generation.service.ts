import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ENVIRONMENT } from '@doci/shared';
import { ProjectService } from '../project.service';
import { resolveEntityUuid, extractCodeSnippet } from '../../utils/entityResolver';

@Injectable({
    providedIn: 'root'
})
export class DescriptionGenerationService {

    private readonly apiUrl = ENVIRONMENT.azureFunction.baseUrl + ENVIRONMENT.azureFunction.generateDescription;

    constructor(
        private readonly http: HttpClient,
        private readonly projectService: ProjectService
    ) { }

    generateComment(entityUuid: string) {
        const currentProject = this.projectService.getCurrentProject();

        if (!currentProject) {
            throw new Error('No current project available');
        }

        // Resolve the entity from the UUID
        const resolvedEntity = resolveEntityUuid(entityUuid, currentProject);

        if (!resolvedEntity) {
            throw new Error(`Entity with UUID ${entityUuid} not found in the current project`);
        }

        // Extract the code snippet
        const codeSnippet = extractCodeSnippet(resolvedEntity);

        if (!codeSnippet) {
            throw new Error(`Could not extract code snippet for entity with UUID ${entityUuid}`);
        }

        // Prepare the payload for the API
        const payload = {
            entityType: resolvedEntity.entityType.toLowerCase(),
            entityName: resolvedEntity.entityName,
            codeSnippet: codeSnippet,
            language: resolvedEntity.language
        };

        console.log(payload);

        return this.http.post<{ documentation: string }>(this.apiUrl, payload);
    }
}