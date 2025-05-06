import { ClassDetail, ClassTemporaryDetail, ConstructorMethodDetail, Details, MethodDetail, MethodsUsedDetail, PropertyDetail } from '@doci/shared';
import { buildClassDetails, assignCommentsToClasses } from '../build-class-details';

jest.mock('../../../utils/utils', () => ({
    generateUUID: jest.fn((prefix, uuid) => `${prefix}-${uuid}`)
}));

describe('buildClassDetails', () => {
    const mockStartPosition = { row: 1, column: 0 };
    const mockEndPosition = { row: 10, column: 0 };

    const mockClass: ClassTemporaryDetail = {
        uuid: 'class-uuid',
        name: 'TestClass',
        modifiers: ['public'],
        inheritance: ['BaseClass'],
        methods: [{ name: 'testMethod' }],
        constructors: [{ name: 'constructor' }],
        properties: [{ name: 'testProperty' }],
        body: 'class body',
        comment: 'class comment',
        startPosition: mockStartPosition,
        endPosition: mockEndPosition
    };

    const mockMethod: MethodDetail = {
        uuid: 'method-uuid',
        name: 'testMethod',
        modifiers: ['public'],
        parameters: [],
        body: 'method body',
        genericName: '',
        predefinedType: [],
        objectType: [],
        startPosition: { row: 2, column: 0 },
        endPosition: { row: 3, column: 0 }
    };

    const mockConstructor: ConstructorMethodDetail = {
        name: 'constructor',
        modifiers: ['public'],
        parameters: [],
        body: 'constructor body',
        startPosition: { row: 4, column: 0 },
        endPosition: { row: 5, column: 0 }
    };

    const mockProperty: PropertyDetail = {
        name: 'testProperty',
        modifiers: ['private'],
        genericName: '',
        predefinedType: [],
        objectType: ['TestType'],
        startPosition: { row: 6, column: 0 },
        endPosition: { row: 6, column: 20 }
    };

    const mockMethodUsed: MethodsUsedDetail = {
        name: 'usedMethod',
        methodName: 'usedMethod',
        expressionName: 'testProperty',
        methodUsedIn: '',
        classUsedIn: '',
        objectType: '',
        startPosition: { row: 2, column: 5 },
        endPosition: { row: 2, column: 15 }
    };

    it('should build class details with all components', () => {
        const result = buildClassDetails(
            [mockClass],
            [mockProperty],
            [mockMethod],
            [mockConstructor],
            [mockMethodUsed]
        );

        expect(result).toHaveLength(1);
        const classDetail = result[0];
        expect(classDetail.name).toBe('TestClass');
        expect(classDetail.methods[0].uuid).toBe('class-uuid-method-uuid');
        expect(classDetail.constructors).toHaveLength(1);
        expect(classDetail.properties).toHaveLength(1);
        expect(classDetail.methodsUsed[0].objectType).toBe('TestType');
        expect(classDetail.methodsUsed[0].classUsedIn).toBe('TestClass');
        expect(classDetail.objectsUsed).toEqual(['TestType']);
    });

    it('should handle empty arrays', () => {
        const result = buildClassDetails(
            [mockClass],
            [],
            [],
            [],
            []
        );

        expect(result).toHaveLength(1);
        const classDetail = result[0];
        expect(classDetail.properties).toHaveLength(0);
        expect(classDetail.methods).toHaveLength(0);
        expect(classDetail.constructors).toHaveLength(0);
        expect(classDetail.methodsUsed).toHaveLength(0);
        expect(classDetail.objectsUsed).toHaveLength(0);
    });

    it('should filter methods and properties based on position', () => {
        const outsideMethod: MethodDetail = {
            ...mockMethod,
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 10 }
        };

        const result = buildClassDetails(
            [mockClass],
            [mockProperty],
            [mockMethod, outsideMethod],
            [mockConstructor],
            [mockMethodUsed]
        );

        expect(result[0].methods).toHaveLength(1);
        expect(result[0].methods[0].name).toBe('testMethod');
    });

    it('should handle methods used mapping correctly', () => {
        const methodInMethod: MethodsUsedDetail = {
            ...mockMethodUsed,
            startPosition: { row: 2, column: 5 },
            endPosition: { row: 2, column: 15 }
        };

        const result = buildClassDetails(
            [mockClass],
            [mockProperty],
            [mockMethod],
            [mockConstructor],
            [methodInMethod]
        );

        expect(result[0].methodsUsed[0].methodUsedIn).toBe('testMethod');
        expect(result[0].methodsUsed[0].objectType).toBe('TestType');
    });
});

describe('assignCommentsToClasses', () => {
    const mockClass: ClassTemporaryDetail = {
        uuid: 'class-uuid',
        name: 'TestClass',
        modifiers: [],
        inheritance: [],
        methods: [],
        constructors: [],
        properties: [],
        body: '',
        startPosition: { row: 5, column: 0 },
        endPosition: { row: 10, column: 0 }
    };

    const mockComment: Details = {
        name: 'Test comment',
        startPosition: { row: 3, column: 0 },
        endPosition: { row: 3, column: 20 }
    };

    it('should assign comment to nearest class within 3 lines', () => {
        const result = assignCommentsToClasses([mockComment], [mockClass]);

        expect(result.updatedClasses[0].comment).toBe('Test comment');
        expect(result.leftComments).toHaveLength(0);
    });

    it('should not assign comment if too far from class', () => {
        const farComment: Details = {
            ...mockComment,
            startPosition: { row: 0, column: 0 }
        };

        const result = assignCommentsToClasses([farComment], [mockClass]);

        expect(result.updatedClasses[0].comment).toBeUndefined();
        expect(result.leftComments).toHaveLength(1);
    });

    it('should handle multiple comments for same class', () => {
        const secondComment: Details = {
            name: 'Second comment',
            startPosition: { row: 4, column: 0 },
            endPosition: { row: 4, column: 20 }
        };

        const result = assignCommentsToClasses(
            [mockComment, secondComment],
            [mockClass]
        );

        expect(result.updatedClasses[0].comment).toBe('Test comment\nSecond comment');
        expect(result.leftComments).toHaveLength(0);
    });

    it('should ignore comments inside class body', () => {
        const insideComment: Details = {
            name: 'Inside comment',
            startPosition: { row: 6, column: 0 },
            endPosition: { row: 6, column: 20 }
        };

        const result = assignCommentsToClasses([insideComment], [mockClass]);

        expect(result.updatedClasses[0].comment).toBeUndefined();
        expect(result.leftComments).toHaveLength(0);
    });

    it('should handle undefined inputs', () => {
        expect(assignCommentsToClasses(undefined, [])).toEqual({
            updatedClasses: [],
            leftComments: []
        });

        const result = assignCommentsToClasses([], []);
        expect(result.updatedClasses).toHaveLength(0);
        expect(result.leftComments).toHaveLength(0);
    });

    it('should preserve existing comments when adding new ones', () => {
        const classWithComment: ClassTemporaryDetail = {
            ...mockClass,
            comment: 'Existing comment'
        };

        const result = assignCommentsToClasses([mockComment], [classWithComment]);

        expect(result.updatedClasses[0].comment).toBe('Existing comment\nTest comment');
    });
}); 