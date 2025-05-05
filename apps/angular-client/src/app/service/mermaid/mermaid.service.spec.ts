import { TestBed } from '@angular/core/testing';
import { MermaidService } from './mermaid.service';
import { ProjectService } from '../project.service';
import { ClassDetail, EnumDetail, MethodDetail, ParameterDetail, PropertyDetail, MethodsUsedDetail } from '@doci/shared';

function createMockNodePosition() {
    return {
        row: 0,
        column: 0
    };
}

function createMockMethodsUsed(): MethodsUsedDetail[] {
    return [];
}

function createMockParameter(params: Partial<Omit<ParameterDetail, 'objectType'>> & { objectType?: string[] }): ParameterDetail {
    return {
        name: params.name || '',
        varName: params.varName || [''],
        objectType: params.objectType || [],
        genericName: params.genericName || [],
        startPosition: params.startPosition || createMockNodePosition(),
        endPosition: params.endPosition || createMockNodePosition()
    };
}

function createMockMethod(params: Partial<Omit<MethodDetail, 'modifiers' | 'predefinedType' | 'objectType'>> & {
    modifiers?: string[];
    predefinedType?: string[];
    objectType?: string[];
}): MethodDetail {
    return {
        name: params.name || '',
        modifiers: params.modifiers || [],
        parameters: Array.isArray(params.parameters) ? params.parameters : [],
        predefinedType: params.predefinedType || [],
        objectType: params.objectType || [],
        genericName: params.genericName || '',
        uuid: params.uuid || 'test-uuid',
        body: params.body || '',
        startPosition: params.startPosition || createMockNodePosition(),
        endPosition: params.endPosition || createMockNodePosition()
    };
}

function createMockProperty(params: Partial<Omit<PropertyDetail, 'modifiers' | 'predefinedType' | 'objectType'>> & {
    modifiers?: string[];
    predefinedType?: string[];
    objectType?: string[];
}): PropertyDetail {
    return {
        name: params.name || '',
        modifiers: params.modifiers || [],
        predefinedType: params.predefinedType || [],
        objectType: params.objectType || [],
        genericName: params.genericName || '',
        startPosition: params.startPosition || createMockNodePosition(),
        endPosition: params.endPosition || createMockNodePosition()
    };
}

function createMockClass(params: Partial<Omit<ClassDetail, 'modifiers' | 'inheritance' | 'objectsUsed'>> & {
    modifiers?: string[];
    inheritance?: string[];
    objectsUsed?: string[];
}): ClassDetail {
    return {
        name: params.name || '',
        modifiers: params.modifiers || [],
        properties: Array.isArray(params.properties) ? params.properties : [],
        methods: Array.isArray(params.methods) ? params.methods : [],
        constructors: Array.isArray(params.constructors) ? params.constructors : [],
        inheritance: params.inheritance || [],
        objectsUsed: params.objectsUsed || [],
        methodsUsed: params.methodsUsed || createMockMethodsUsed(),
        uuid: params.uuid || 'test-class-uuid',
        body: params.body || '',
        startPosition: params.startPosition || createMockNodePosition(),
        endPosition: params.endPosition || createMockNodePosition()
    };
}

describe('MermaidService', () => {
    let service: MermaidService;
    let projectService: jest.Mocked<ProjectService>;

    const mockClassDetail = createMockClass({
        name: 'TestClass',
        modifiers: ['public'],
        properties: [
            createMockProperty({
                name: 'stringProp',
                modifiers: ['private'],
                predefinedType: ['string'],
                objectType: []
            }),
            createMockProperty({
                name: 'arrayProp',
                modifiers: ['public'],
                predefinedType: ['string'],
                objectType: [],
                genericName: 'Array'
            }),
            createMockProperty({
                name: 'customProp',
                modifiers: ['protected'],
                predefinedType: [],
                objectType: ['CustomType']
            })
        ],
        methods: [
            createMockMethod({
                name: 'testMethod',
                modifiers: ['public'],
                parameters: [
                    createMockParameter({
                        name: 'param1',
                        varName: ['param1'],
                        objectType: ['string']
                    }),
                    createMockParameter({
                        name: 'param2',
                        varName: ['param2'],
                        genericName: ['Array'],
                        objectType: ['number']
                    })
                ],
                predefinedType: ['void'],
                objectType: []
            }),
            createMockMethod({
                name: 'returnMethod',
                modifiers: ['private'],
                predefinedType: [],
                objectType: ['CustomReturn'],
                genericName: 'Promise'
            })
        ],
        constructors: [
            createMockMethod({
                name: 'constructor',
                modifiers: ['public'],
                parameters: [
                    createMockParameter({
                        name: 'service',
                        varName: ['service'],
                        objectType: ['TestService']
                    })
                ],
                predefinedType: [],
                objectType: []
            })
        ],
        inheritance: ['BaseClass'],
        objectsUsed: ['DependencyClass', 'TestEnum']
    });

    const mockEnumDetail: EnumDetail = {
        name: 'TestEnum',
        modifiers: [],
        members: [
            { member: 'MEMBER_ONE', value: 'MEMBER_ONE' },
            { member: 'MEMBER_TWO', value: 'MEMBER_TWO' }
        ],
        startPosition: createMockNodePosition(),
        endPosition: createMockNodePosition()
    };

    const mockProject = {
        files: [
            {
                details: {
                    classes: [
                        mockClassDetail,
                        createMockClass({
                            name: 'BaseClass',
                            modifiers: ['public']
                        }),
                        createMockClass({
                            name: 'DependencyClass',
                            modifiers: ['public']
                        })
                    ],
                    enums: [mockEnumDetail]
                }
            }
        ]
    };

    beforeEach(() => {
        const projectServiceMock = {
            getCurrentProject: jest.fn().mockReturnValue(mockProject)
        };

        TestBed.configureTestingModule({
            providers: [
                MermaidService,
                { provide: ProjectService, useValue: projectServiceMock }
            ]
        });

        service = TestBed.inject(MermaidService);
        projectService = TestBed.inject(ProjectService) as jest.Mocked<ProjectService>;
    });

    describe('generateClassDiagramFromClass', () => {
        it('should return empty string for null class', () => {
            expect(service.generateClassDiagramFromClass(null as unknown as ClassDetail)).toBe('');
        });

        it('should generate complete class diagram with inheritance and dependencies', () => {
            const diagram = service.generateClassDiagramFromClass(mockClassDetail);

            // Verify class declaration
            expect(diagram).toContain('class TestClass');

            // Verify properties
            expect(diagram).toContain(`\t- stringProp : string`);
            expect(diagram).toContain(`\t+ arrayProp : Array< string >`);
            expect(diagram).toContain(`\t# customProp : CustomType`);

            // Verify methods
            expect(diagram).toContain(`\t+ testMethod(param1: string, param2: number)`);
            expect(diagram).toContain(`\t- returnMethod() Promise< CustomReturn >`);

            // Verify constructor
            expect(diagram).toContain(`\t+ constructor(service: TestService)`);

            // Verify inheritance
            expect(diagram).toContain('BaseClass <|-- TestClass');

            // Verify dependencies
            expect(diagram).toContain('DependencyClass -- TestClass');
            expect(diagram).toContain('TestEnum -- TestClass');
        });

        it('should handle abstract classes', () => {
            const abstractClass = createMockClass({
                name: 'TestClass',
                modifiers: ['abstract']
            });
            const diagram = service.generateClassDiagramFromClass(abstractClass);
            expect(diagram).toContain('<<abstract>>');
        });
    });

    describe('generateClassDiagramFromEnum', () => {
        it('should return empty string for null enum', () => {
            expect(service.generateClassDiagramFromEnum(null as unknown as EnumDetail)).toBe('');
        });

        it('should generate enum diagram', () => {
            const diagram = service.generateClassDiagramFromEnum(mockEnumDetail);

            // Verify enum declaration
            expect(diagram).toContain('class TestEnum');
            expect(diagram).toContain('<<enumeration>>');

            // Verify enum members
            expect(diagram).toContain('MEMBER_ONE');
            expect(diagram).toContain('MEMBER_TWO');
        });
    });

    describe('buildProperty', () => {
        it('should format simple property', () => {
            const property = createMockProperty({
                name: 'testProp',
                modifiers: ['private'],
                predefinedType: ['string']
            });
            expect(service.buildProperty(property)).toBe(`\t- testProp : string`);
        });

        it('should format generic property', () => {
            const property = createMockProperty({
                name: 'testProp',
                modifiers: ['public'],
                predefinedType: ['string'],
                genericName: 'Array'
            });
            expect(service.buildProperty(property)).toBe(`\t+ testProp : Array< string >`);
        });

        it('should format custom type property', () => {
            const property = createMockProperty({
                name: 'testProp',
                modifiers: ['protected'],
                objectType: ['CustomType']
            });
            expect(service.buildProperty(property)).toBe(`\t# testProp : CustomType`);
        });
    });

    describe('getReturnType', () => {
        it('should handle void return type', () => {
            const method = createMockMethod({
                name: 'testMethod',
                modifiers: ['public'],
                predefinedType: ['void']
            });
            expect(service.getReturnType(method)).toBe('');
        });

        it('should format generic return type', () => {
            const method = createMockMethod({
                name: 'testMethod',
                modifiers: ['public'],
                predefinedType: ['string'],
                genericName: 'Observable'
            });
            expect(service.getReturnType(method)).toBe('Observable< string >');
        });

        it('should format custom return type', () => {
            const method = createMockMethod({
                name: 'testMethod',
                modifiers: ['public'],
                objectType: ['CustomType']
            });
            expect(service.getReturnType(method)).toBe('CustomType');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty project', () => {
            projectService.getCurrentProject.mockReturnValue(null);
            const diagram = service.generateClassDiagramFromClass(mockClassDetail);
            expect(diagram).toContain('class TestClass');
        });

        it('should handle class with no properties or methods', () => {
            const emptyClass = createMockClass({
                name: 'EmptyClass',
                modifiers: ['public']
            });
            const diagram = service.generateClassDiagramFromClass(emptyClass);
            expect(diagram).toContain('class EmptyClass');
        });

        it('should handle class with invalid modifiers', () => {
            const invalidClass = createMockClass({
                ...mockClassDetail,
                modifiers: ['invalid']
            });
            const diagram = service.generateClassDiagramFromClass(invalidClass);
            expect(diagram).toContain('class TestClass');
        });

        it('should handle circular dependencies', () => {
            const circularClass = createMockClass({
                ...mockClassDetail,
                objectsUsed: ['TestClass']
            });
            const diagram = service.generateClassDiagramFromClass(circularClass);
            expect(diagram).toContain('class TestClass');
        });
    });
});