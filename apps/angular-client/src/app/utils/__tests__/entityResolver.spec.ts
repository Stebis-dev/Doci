import { FlatProject, ProjectFile, ClassDetail, MethodDetail, PropertyDetail, ConstructorMethodDetail, EnumDetail, ExtractorType } from '@doci/shared';
import { resolveEntityUuid, extractCodeSnippet, EntityType, ResolvedEntity } from '../entityResolver';

describe('entityResolver', () => {
    const mockPosition = { row: 1, column: 0 };

    const mockMethod: MethodDetail = {
        uuid: 'method-1',
        name: 'testMethod',
        modifiers: ['public'],
        parameters: [],
        body: 'method body',
        genericName: '',
        predefinedType: [],
        objectType: [],
        startPosition: { row: 2, column: 4 },
        endPosition: { row: 4, column: 4 }
    };

    const mockProperty: PropertyDetail = {
        name: 'testProperty',
        modifiers: ['private'],
        genericName: '',
        predefinedType: ['string'],
        objectType: [],
        startPosition: { row: 5, column: 4 },
        endPosition: { row: 5, column: 24 }
    };

    const mockConstructor: ConstructorMethodDetail = {
        name: 'TestClass',
        modifiers: ['public'],
        parameters: [],
        body: 'constructor body',
        startPosition: { row: 6, column: 4 },
        endPosition: { row: 8, column: 4 }
    };

    const mockClass: ClassDetail = {
        uuid: 'class-1',
        name: 'TestClass',
        modifiers: ['public'],
        inheritance: [],
        methods: [mockMethod],
        constructors: [mockConstructor],
        properties: [mockProperty],
        methodsUsed: [],
        objectsUsed: [],
        body: 'class body',
        startPosition: mockPosition,
        endPosition: { row: 10, column: 0 }
    };

    const mockEnum: EnumDetail = {
        name: 'TestEnum',
        modifiers: ['public'],
        members: [
            { member: 'ONE', value: '1' },
            { member: 'TWO', value: '2' }
        ],
        startPosition: { row: 12, column: 0 },
        endPosition: { row: 15, column: 0 }
    };

    const mockFile: ProjectFile = {
        name: 'test.ts',
        path: 'src/test.ts',
        uuid: 'FILE-test.ts',
        type: 'typescript',
        content: `
public class TestClass {
    public void testMethod() {
        // Method body
    }
    private string testProperty;
    public TestClass() {
        // Constructor body
    }
}

public enum TestEnum {
    ONE = 1,
    TWO = 2
}`,
        details: {
            filePath: 'src/test.ts',
            [ExtractorType.Class]: [mockClass],
            [ExtractorType.Enum]: [mockEnum]
        }
    };

    const mockProject: FlatProject = {
        files: [mockFile],
        name: 'test-project',
        path: '/test-project'
    };

    describe('resolveEntityUuid', () => {
        it('should handle null inputs', () => {
            expect(resolveEntityUuid(null as any, null as any)).toBeNull();
            expect(resolveEntityUuid('', mockProject)).toBeNull();
        });

        it('should resolve file UUID', () => {
            const result = resolveEntityUuid('FILE-test.ts', mockProject);
            expect(result).not.toBeNull();
            expect(result?.entityType).toBe(EntityType.FILE);
            expect(result?.file).toBe(mockFile);
        });

        it('should resolve class UUID', () => {
            const result = resolveEntityUuid('FILE-test.ts-CLASS-TestClass', mockProject);
            expect(result?.entityType).toBe(EntityType.CLASS);
            expect(result?.class).toBe(mockClass);
        });

        it('should resolve method UUID', () => {
            const result = resolveEntityUuid('FILE-test.ts-CLASS-TestClass-METHOD-testMethod', mockProject);
            expect(result?.entityType).toBe(EntityType.METHOD);
            expect(result?.method).toBe(mockMethod);
        });

        it('should resolve property UUID', () => {
            const result = resolveEntityUuid('FILE-test.ts-CLASS-TestClass-PROPERTY-testProperty', mockProject);
            expect(result?.entityType).toBe(EntityType.PROPERTY);
            expect(result?.property).toBe(mockProperty);
        });

        it('should resolve constructor UUID', () => {
            const result = resolveEntityUuid('FILE-test.ts-CLASS-TestClass-CONSTRUCTOR-TestClass', mockProject);
            expect(result?.entityType).toBe(EntityType.CONSTRUCTOR);
            expect(result?.constructorMethod).toBe(mockConstructor);
        });

        it('should resolve enum UUID', () => {
            const result = resolveEntityUuid('FILE-test.ts-ENUM-TestEnum', mockProject);
            expect(result?.entityType).toBe(EntityType.ENUM);
            expect(result?.enum).toBe(mockEnum);
        });

        it('should handle non-existent file', () => {
            const result = resolveEntityUuid('file-2-nonexistent.ts-CLASS-TestClass', mockProject);
            expect(result).toBeNull();
        });

        it('should handle non-existent class', () => {
            const result = resolveEntityUuid('file-1-test.ts-CLASS-NonExistentClass', mockProject);
            expect(result?.class).toBeUndefined();
        });

        it('should handle non-existent method', () => {
            const result = resolveEntityUuid('file-1-test.ts-CLASS-TestClass-METHOD-nonExistentMethod', mockProject);
            expect(result?.method).toBeUndefined();
        });

        it('should handle file without details', () => {
            const fileWithoutDetails: ProjectFile = { ...mockFile, details: undefined };
            const projectWithoutDetails: FlatProject = { ...mockProject, files: [fileWithoutDetails] };
            const result = resolveEntityUuid('file-1-test.ts-CLASS-TestClass', projectWithoutDetails);
            expect(result?.class).toBeUndefined();
        });
    });

    describe('extractCodeSnippet', () => {
        it('should extract method code snippet', () => {
            const entity: ResolvedEntity = {
                file: mockFile,
                method: mockMethod,
                entityType: EntityType.METHOD,
                language: 'typescript',
                entityName: 'testMethod',
                fullUuid: 'file-1-test.ts-CLASS-TestClass-METHOD-testMethod'
            };
            const snippet = extractCodeSnippet(entity);
            expect(snippet).toContain('testMethod');
        });

        it('should extract class code snippet', () => {
            const entity: ResolvedEntity = {
                file: mockFile,
                class: mockClass,
                entityType: EntityType.CLASS,
                language: 'typescript',
                entityName: 'TestClass',
                fullUuid: 'file-1-test.ts-CLASS-TestClass'
            };
            const snippet = extractCodeSnippet(entity);
            expect(snippet).toContain('TestClass');
        });

        it.skip('should extract property code snippet', () => {
            const entity: ResolvedEntity = {
                file: mockFile,
                property: mockProperty,
                entityType: EntityType.PROPERTY,
                language: 'typescript',
                entityName: 'testProperty',
                fullUuid: 'file-1-test.ts-CLASS-TestClass-PROPERTY-testProperty'
            };
            const snippet = extractCodeSnippet(entity);
            expect(snippet).toContain('testProperty');
        });

        it('should extract constructor code snippet', () => {
            const entity: ResolvedEntity = {
                file: mockFile,
                constructorMethod: mockConstructor,
                entityType: EntityType.CONSTRUCTOR,
                language: 'typescript',
                entityName: 'TestClass',
                fullUuid: 'file-1-test.ts-CLASS-TestClass-CONSTRUCTOR-TestClass'
            };
            const snippet = extractCodeSnippet(entity);
            expect(snippet).toContain('TestClass');
        });

        it.skip('should extract enum code snippet', () => {
            const entity: ResolvedEntity = {
                file: mockFile,
                enum: mockEnum,
                entityType: EntityType.ENUM,
                language: 'typescript',
                entityName: 'TestEnum',
                fullUuid: 'file-1-test.ts-ENUM-TestEnum'
            };
            const snippet = extractCodeSnippet(entity);
            expect(snippet).toContain('TestEnum');
        });

        it('should handle null inputs', () => {
            expect(extractCodeSnippet(null as any)).toBeNull();
            expect(extractCodeSnippet({} as ResolvedEntity)).toBeNull();
        });

        it('should handle missing file content', () => {
            const entity: ResolvedEntity = {
                file: { ...mockFile, content: undefined },
                method: mockMethod,
                entityType: EntityType.METHOD,
                language: 'typescript',
                entityName: 'testMethod',
                fullUuid: 'file-1-test.ts-CLASS-TestClass-METHOD-testMethod'
            };
            expect(extractCodeSnippet(entity)).toBeNull();
        });

        it('should handle single-line entities', () => {
            const singleLineMethod: MethodDetail = {
                ...mockMethod,
                startPosition: { row: 1, column: 4 },
                endPosition: { row: 1, column: 24 }
            };
            const entity: ResolvedEntity = {
                file: mockFile,
                method: singleLineMethod,
                entityType: EntityType.METHOD,
                language: 'typescript',
                entityName: 'testMethod',
                fullUuid: 'file-1-test.ts-CLASS-TestClass-METHOD-testMethod'
            };
            const snippet = extractCodeSnippet(entity);
            expect(snippet).not.toBeNull();
        });
    });
}); 