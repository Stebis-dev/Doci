import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClassDetailsComponent } from './class-details.component';
import { DomSanitizer } from '@angular/platform-browser';
import { MermaidService } from '../../service/mermaid/mermaid.service';
import { ProjectService } from '../../service/project.service';
import { ThemeService } from '../../service/theme.service';
import { ClassDetail, EnumDetail, ExtractorType, NodePosition, ProjectFile } from '@doci/shared';
import { BehaviorSubject, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MethodListComponent } from '../method-list/method-list.component';
import { PropertyListComponent } from '../property-list/property-list.component';
import { ConstructorListComponent } from '../constructor-list/constructor-list.component';
import { EnumMemberListComponent } from '../enum-member-list/enum-member-list.component';
import { DescriptionComponent } from '../description/description.component';

// Mock mermaid library
jest.mock('mermaid', () => ({
    initialize: jest.fn(),
    render: jest.fn().mockResolvedValue({ svg: '<svg>test</svg>' })
}));

describe('ClassDetailsComponent', () => {
    let component: ClassDetailsComponent;
    let fixture: ComponentFixture<ClassDetailsComponent>;
    let mermaidService: jest.Mocked<MermaidService>;
    let sanitizer: jest.Mocked<DomSanitizer>;
    let projectService: jest.Mocked<ProjectService>;
    let themeService: jest.Mocked<ThemeService>;
    let themeSubject: BehaviorSubject<'light' | 'dark'>;

    const mockPosition: NodePosition = {
        row: 0,
        column: 0
    };

    const mockClass: ClassDetail = {
        name: 'TestClass',
        methods: [],
        properties: [],
        constructors: [],
        modifiers: ['public'],
        uuid: 'test-class-uuid',
        methodsUsed: [],
        inheritance: [],
        objectsUsed: [],
        body: '',
        comment: 'Test class comment',
        startPosition: mockPosition,
        endPosition: mockPosition
    };

    const mockEnum: EnumDetail = {
        name: 'TestEnum',
        members: [],
        modifiers: ['public'],
        startPosition: mockPosition,
        endPosition: mockPosition
    };

    const mockFile: ProjectFile = {
        path: 'src/test.ts',
        name: 'test.ts',
        content: '',
        uuid: 'test-file-uuid',
        details: {
            [ExtractorType.Class]: [mockClass],
            [ExtractorType.Enum]: [mockEnum],
            filePath: 'src/test.ts'
        }
    };

    beforeEach(async () => {
        themeSubject = new BehaviorSubject<'light' | 'dark'>('light');

        mermaidService = {
            generateClassDiagramFromClass: jest.fn().mockReturnValue('classDiagram'),
            generateClassDiagramFromEnum: jest.fn().mockReturnValue('enumDiagram')
        } as any;

        sanitizer = {
            bypassSecurityTrustHtml: jest.fn().mockImplementation(html => html)
        } as any;

        projectService = {
            getCurrentProject: jest.fn().mockReturnValue({ files: [mockFile] }),
            updateCurrentProject: jest.fn(),
            currentProject$: new BehaviorSubject({ files: [mockFile] })
        } as any;

        themeService = {
            currentTheme$: themeSubject,
            getMermaidTheme: jest.fn().mockReturnValue('default')
        } as any;

        await TestBed.configureTestingModule({
            imports: [
                CommonModule,
                ClassDetailsComponent,
                MethodListComponent,
                PropertyListComponent,
                ConstructorListComponent,
                EnumMemberListComponent,
                DescriptionComponent
            ],
            providers: [
                { provide: MermaidService, useValue: mermaidService },
                { provide: DomSanitizer, useValue: sanitizer },
                { provide: ProjectService, useValue: projectService },
                { provide: ThemeService, useValue: themeService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ClassDetailsComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(component.file).toBeNull();
            expect(component.selectedNode).toBeNull();
            expect(component.classObj).toBeNull();
            expect(component.enumObj).toBeNull();
            expect(component.methods).toEqual([]);
            expect(component.properties).toEqual([]);
            expect(component.constructors).toEqual([]);
        });

        it('should initialize mermaid with correct theme', () => {
            component.ngOnInit();
            expect(themeService.getMermaidTheme).toHaveBeenCalled();
        });
    });

    describe('File Details Update', () => {
        beforeEach(() => {
            component.file = mockFile;
        });

        it('should update class details when class node is selected', () => {
            component.selectedNode = {
                selectedType: 'class',
                className: 'TestClass',
                file: mockFile
            };
            component.ngOnChanges({
                file: { currentValue: mockFile, previousValue: null, firstChange: true, isFirstChange: () => true },
                selectedNode: {
                    currentValue: component.selectedNode,
                    previousValue: null,
                    firstChange: true,
                    isFirstChange: () => true
                }
            });

            expect(component.classObj).toBeTruthy();
            expect(component.classObj?.name).toBe('TestClass');
            expect(mermaidService.generateClassDiagramFromClass).toHaveBeenCalledWith(mockClass);
        });

        it('should update enum details when enum node is selected', () => {
            component.selectedNode = {
                selectedType: 'enum',
                enumName: 'TestEnum',
                file: mockFile
            };
            component.ngOnChanges({
                file: { currentValue: mockFile, previousValue: null, firstChange: true, isFirstChange: () => true },
                selectedNode: {
                    currentValue: component.selectedNode,
                    previousValue: null,
                    firstChange: true,
                    isFirstChange: () => true
                }
            });

            expect(component.enumObj).toBeTruthy();
            expect(component.enumObj?.name).toBe('TestEnum');
            expect(mermaidService.generateClassDiagramFromEnum).toHaveBeenCalledWith(mockEnum);
        });
    });

    describe('Method Filtering', () => {
        beforeEach(() => {
            const methodsWithModifiers = [
                { ...mockClass.methods[0], modifiers: ['public'] },
                { ...mockClass.methods[0], modifiers: ['private'] },
                { ...mockClass.methods[0], modifiers: ['protected'] },
                { ...mockClass.methods[0], modifiers: [] }
            ];
            component.methods = methodsWithModifiers;
        });

        it('should filter public methods', () => {
            const publicMethods = component.getPublicMethods();
            expect(publicMethods.length).toBe(1);
            expect(publicMethods[0].modifiers).toContain('public');
        });

        it('should filter private methods', () => {
            const privateMethods = component.getPrivateMethods();
            expect(privateMethods.length).toBe(1);
            expect(privateMethods[0].modifiers).toContain('private');
        });

        it('should filter protected methods', () => {
            const protectedMethods = component.getProtectedMethods();
            expect(protectedMethods.length).toBe(1);
            expect(protectedMethods[0].modifiers).toContain('protected');
        });

        it('should get methods without access modifiers', () => {
            const methods = component.getMethods();
            expect(methods.length).toBe(1);
            expect(methods[0].modifiers).toEqual([]);
        });
    });

    describe('Description Management', () => {
        beforeEach(() => {
            component.file = mockFile;
            component.selectedNode = {
                selectedType: 'class',
                className: 'TestClass',
                file: mockFile
            };
            component.ngOnChanges({
                file: { currentValue: mockFile, previousValue: null, firstChange: true, isFirstChange: () => true }
            });
        });

        it('should handle description generation', () => {
            const testDescription = 'Generated description';
            component.onDescriptionGenerated(testDescription);
            expect(component.generatedDescription).toBe(testDescription);
        });

        it('should save and update description', () => {
            const newDescription = 'Updated description';
            component.onSaveDescription(newDescription);

            expect(component.isEditingDescription).toBeFalsy();
            expect(component.classObj?.comment).toBe(newDescription);
            expect(projectService.updateCurrentProject).toHaveBeenCalled();
        });

        it('should cancel description editing', () => {
            component.isEditingDescription = true;
            component.onCancelDescriptionEdit();
            expect(component.isEditingDescription).toBeFalsy();
        });
    });

    describe('Theme Changes', () => {
        it('should reinitialize mermaid when theme changes', () => {
            component.file = mockFile;
            component.selectedNode = {
                selectedType: 'class',
                className: 'TestClass',
                file: mockFile
            };
            component.ngOnInit();
            themeSubject.next('dark');

            expect(themeService.getMermaidTheme).toHaveBeenCalledTimes(3);
            expect(mermaidService.generateClassDiagramFromClass).toHaveBeenCalled();
        });
    });

    describe('Mermaid Diagram', () => {
        it('should render mermaid diagram for class', async () => {
            component.file = mockFile;
            component.selectedNode = {
                selectedType: 'class',
                className: 'TestClass',
                file: mockFile
            };
            await component.ngOnChanges({
                file: { currentValue: mockFile, previousValue: null, firstChange: true, isFirstChange: () => true }
            });

            expect(mermaidService.generateClassDiagramFromClass).toHaveBeenCalled();
            expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalled();
            expect(component.renderedSVG).toBeTruthy();
        });

        it('should handle mermaid render error gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const mermaid = require('mermaid');
            mermaid.render.mockRejectedValueOnce(new Error('Render failed'));

            component.file = mockFile;
            component.selectedNode = {
                selectedType: 'class',
                className: 'TestClass',
                file: mockFile
            };
            await component.ngOnChanges({
                file: { currentValue: mockFile, previousValue: null, firstChange: true, isFirstChange: () => true }
            });

            expect(consoleSpy).toHaveBeenCalledWith('Error rendering Mermaid diagram', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
}); 