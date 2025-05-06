import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DescriptionGenerationService } from './description-generation.service';
import { ProjectService } from '../project.service';
import { ENVIRONMENT } from '@doci/shared';

describe('DescriptionGenerationService', () => {
    let service: DescriptionGenerationService;
    let httpMock: HttpTestingController;
    let projectService: jest.Mocked<ProjectService>;

    const mockProject = {
        name: 'Test Project',
        path: '/test/project',
        files: [{
            uuid: 'FILE-test.ts',
            name: 'test.ts',
            path: '/test/path.ts',
            type: 'typescript',
            content: 'function test() { return true; }',
            details: {
                filePath: '/test/path.ts',
                functions: [{
                    uuid: 'test-uuid',
                    name: 'TestFunction',
                    content: 'function test() { return true; }',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 28 }
                }],
                startPosition: { row: 0, column: 0 },
                endPosition: { row: 0, column: 28 }
            }
        }],
        entities: [
            {
                uuid: 'test-uuid',
                entityName: 'TestFunction',
                entityType: 'FUNCTION',
                language: 'typescript',
                content: 'function test() { return true; }',
                startLine: 1,
                endLine: 3,
                filePath: '/test/path.ts'
            }
        ]
    };

    beforeEach(() => {
        const projectServiceMock = {
            getCurrentProject: jest.fn()
        };

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                DescriptionGenerationService,
                { provide: ProjectService, useValue: projectServiceMock }
            ]
        });

        service = TestBed.inject(DescriptionGenerationService);
        httpMock = TestBed.inject(HttpTestingController);
        projectService = TestBed.inject(ProjectService) as jest.Mocked<ProjectService>;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('generateComment', () => {
        const apiUrl = ENVIRONMENT.azureFunction.baseUrl + ENVIRONMENT.azureFunction.generateDescription;

        it.skip('should successfully generate a comment', () => {
            projectService.getCurrentProject.mockReturnValue(mockProject);
            const expectedResponse = { documentation: 'Test documentation' };

            service.generateComment('FILE-test.ts').subscribe(response => {
                expect(response).toEqual(expectedResponse);
            });

            const req = httpMock.expectOne(apiUrl);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                entityType: 'file',
                entityName: 'test.ts',
                codeSnippet: 'function test() { return true; }',
                language: 'typescript'
            });

            req.flush(expectedResponse);
        });

        it('should throw error when no current project is available', () => {
            projectService.getCurrentProject.mockReturnValue(null);

            expect(() => service.generateComment('test-uuid'))
                .toThrow('No current project available');
        });

        it('should throw error when entity is not found', () => {
            projectService.getCurrentProject.mockReturnValue(mockProject);

            expect(() => service.generateComment('non-existent-uuid'))
                .toThrow('Entity with UUID non-existent-uuid not found in the current project');
        });

        it('should throw error when code snippet cannot be extracted', () => {
            const projectWithInvalidEntity = {
                ...mockProject,
                files: [{
                    ...mockProject.files[0],
                    content: undefined
                }]
            };
            projectService.getCurrentProject.mockReturnValue(projectWithInvalidEntity);

            expect(() => service.generateComment('FILE-test.ts'))
                .toThrow('Could not extract code snippet for entity with UUID FILE-test.ts');
        });
    });
}); 