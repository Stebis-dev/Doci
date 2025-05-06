import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileTreeComponent } from './file-tree.component';
import { ProjectService } from '../../service/project.service';
import { BehaviorSubject } from 'rxjs';
import { ProjectFile, ClassDetail, MethodDetail, EnumDetail, NodePosition } from '@doci/shared';
import { IconComponent } from '../icon.component';

describe('FileTreeComponent', () => {
    let component: FileTreeComponent;
    let fixture: ComponentFixture<FileTreeComponent>;
    let projectService: Partial<ProjectService>;
    let mockCurrentProject$: BehaviorSubject<any>;

    const mockPosition: NodePosition = {
        row: 0,
        column: 0
    };

    const mockProjectFile: ProjectFile = {
        path: 'src/app/test.ts',
        name: 'test.ts',
        content: '',
        details: {
            filePath: 'src/app/test.ts',
            classes: [{
                name: 'TestClass',
                methods: [{
                    name: 'testMethod',
                    parameters: [],
                    modifiers: [],
                    uuid: 'test-uuid',
                    genericName: '',
                    predefinedType: [],
                    objectType: [],
                    body: '',
                    startPosition: mockPosition,
                    endPosition: mockPosition
                }],
                modifiers: [],
                uuid: 'test-class-uuid',
                properties: [],
                constructors: [],
                methodsUsed: [],
                inheritance: [],
                objectsUsed: [],
                body: '',
                startPosition: mockPosition,
                endPosition: mockPosition
            }],
            enums: [{
                name: 'TestEnum',
                members: [],
                modifiers: [],
                startPosition: mockPosition,
                endPosition: mockPosition
            }]
        }
    };

    beforeEach(async () => {
        mockCurrentProject$ = new BehaviorSubject(null);
        projectService = {
            currentProject$: mockCurrentProject$
        };

        await TestBed.configureTestingModule({
            imports: [FileTreeComponent, IconComponent],
            providers: [
                { provide: ProjectService, useValue: projectService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FileTreeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Tree Building', () => {
        it('should build empty tree when no project is set', () => {
            mockCurrentProject$.next(null);
            fixture.detectChanges();
            expect(component.treeData).toEqual([]);
        });

        it('should build tree structure from project files', () => {
            const project = {
                files: [mockProjectFile]
            };
            mockCurrentProject$.next(project);
            fixture.detectChanges();

            expect(component.treeData.length).toBe(1);
            expect(component.treeData[0].name).toBe('src');
            expect(component.treeData[0].type).toBe('directory');
        });

        it('should create class nodes with methods', () => {
            const project = {
                files: [mockProjectFile]
            };
            mockCurrentProject$.next(project);
            fixture.detectChanges();

            // Navigate to the file node
            const fileNode = component.treeData[0].children?.[0].children?.[0];
            expect(fileNode?.type).toBe('file');

            // Check class node
            const classNode = fileNode?.children?.[0];
            expect(classNode?.name).toBe('TestClass');
            expect(classNode?.type).toBe('class');

            // Check method node
            const methodNode = classNode?.children?.[0];
            expect(methodNode?.name).toBe('testMethod()');
            expect(methodNode?.type).toBe('method');
        });

        it('should create enum nodes', () => {
            const project = {
                files: [mockProjectFile]
            };
            mockCurrentProject$.next(project);
            fixture.detectChanges();

            // Navigate to the file node
            const fileNode = component.treeData[0].children?.[0].children?.[0];

            // Check enum node
            const enumNode = fileNode?.children?.[1];
            expect(enumNode?.name).toBe('TestEnum');
            expect(enumNode?.type).toBe('enum');
        });
    });

    describe('Node Toggle', () => {
        beforeEach(() => {
            const project = {
                files: [mockProjectFile]
            };
            mockCurrentProject$.next(project);
            fixture.detectChanges();
        });

        it('should toggle directory node expansion', () => {
            const dirNode = component.treeData[0];
            expect(dirNode.isExpanded).toBeFalsy();

            component.toggleNode(dirNode);
            expect(dirNode.isExpanded).toBe(true);

            component.toggleNode(dirNode);
            expect(dirNode.isExpanded).toBeFalsy();
        });

        it('should toggle file node expansion', () => {
            const fileNode = component.treeData[0].children?.[0].children?.[0];
            expect(fileNode?.isExpanded).toBeFalsy();

            if (fileNode) {
                component.toggleNode(fileNode);
                expect(fileNode.isExpanded).toBe(true);

                component.toggleNode(fileNode);
                expect(fileNode.isExpanded).toBeFalsy();
            }
        });

        it('should emit selection when method node is clicked', () => {
            const methodNode = component.treeData[0].children?.[0].children?.[0].children?.[0].children?.[0];
            const emitSpy = jest.spyOn(component.nodeSelected, 'emit');

            if (methodNode) {
                component.toggleNode(methodNode);
                expect(emitSpy).toHaveBeenCalledWith({
                    file: mockProjectFile,
                    selectedType: 'method',
                    className: 'TestClass',
                    methodName: 'testMethod'
                });
            }
        });

        it('should emit selection when class node is clicked', () => {
            const classNode = component.treeData[0].children?.[0].children?.[0].children?.[0];
            const emitSpy = jest.spyOn(component.nodeSelected, 'emit');

            if (classNode) {
                component.toggleNode(classNode);
                expect(emitSpy).toHaveBeenCalledWith({
                    file: mockProjectFile,
                    selectedType: 'class',
                    className: 'TestClass'
                });
            }
        });

        it('should emit selection when enum node is clicked', () => {
            const enumNode = component.treeData[0].children?.[0].children?.[0].children?.[1];
            const emitSpy = jest.spyOn(component.nodeSelected, 'emit');

            if (enumNode) {
                component.toggleNode(enumNode);
                expect(emitSpy).toHaveBeenCalledWith({
                    file: mockProjectFile,
                    selectedType: 'enum',
                    enumName: 'TestEnum'
                });
            }
        });
    });
}); 