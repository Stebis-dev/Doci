import { MethodDetail, ParameterDetail, Details, ClassTemporaryDetail, ConstructorMethodDetail } from "@doci/shared";
import { assignParametersToMethods, assignParametersToConstructors, assignCommentsToMethods } from "../build-method-details";

describe('build-method-details', () => {
    const mockPosition = (row: number, col = 0) => ({ row, column: col });

    describe('assignParametersToMethods', () => {
        const mockMethod: MethodDetail = {
            uuid: 'method-1',
            name: 'testMethod',
            modifiers: ['public'],
            parameters: [
                {
                    name: 'param1',
                    genericName: [],
                    varName: [],
                    objectType: [],
                    startPosition: mockPosition(2, 10),
                    endPosition: mockPosition(2, 20)
                }
            ],
            body: 'method body',
            genericName: '',
            predefinedType: [],
            objectType: [],
            startPosition: mockPosition(2),
            endPosition: mockPosition(4)
        };

        const mockParameter: ParameterDetail = {
            name: 'param1',
            genericName: ['string'],
            varName: ['param1'],
            objectType: [],
            startPosition: mockPosition(2, 10),
            endPosition: mockPosition(2, 20)
        };

        it('should assign parameters to methods correctly', () => {
            const result = assignParametersToMethods([mockParameter], [mockMethod]);
            expect(result[0].parameters[0].genericName).toEqual(['string']);
            expect(result[0].parameters[0].varName).toEqual(['param1']);
        });

        it('should handle empty parameters array', () => {
            const result = assignParametersToMethods([], [mockMethod]);
            expect(result).toEqual([mockMethod]);
        });

        it('should handle null inputs', () => {
            const result = assignParametersToMethods(null as any, null as any);
            expect(result).toEqual(null);
        });
    });

    describe('assignParametersToConstructors', () => {
        const mockConstructor: ConstructorMethodDetail = {
            name: 'constructor',
            modifiers: ['public'],
            parameters: [
                {
                    name: 'param1',
                    genericName: [],
                    varName: [],
                    objectType: [],
                    startPosition: mockPosition(2, 10),
                    endPosition: mockPosition(2, 20)
                }
            ],
            body: 'constructor body',
            startPosition: mockPosition(2),
            endPosition: mockPosition(4)
        };

        const mockParameter: ParameterDetail = {
            name: 'param1',
            genericName: ['string'],
            varName: ['param1'],
            objectType: [],
            startPosition: mockPosition(2, 10),
            endPosition: mockPosition(2, 20)
        };

        it('should assign parameters to constructors correctly', () => {
            const result = assignParametersToConstructors([mockParameter], [mockConstructor]);
            expect(result[0].parameters[0].genericName).toEqual(['string']);
            expect(result[0].parameters[0].varName).toEqual(['param1']);
        });

        it('should handle empty parameters array', () => {
            const result = assignParametersToConstructors([], [mockConstructor]);
            expect(result).toEqual([mockConstructor]);
        });

        it('should handle null inputs', () => {
            const result = assignParametersToConstructors(null as any, null as any);
            expect(result).toEqual(null);
        });
    });

    describe('assignCommentsToMethods', () => {
        const mockMethod: MethodDetail = {
            uuid: 'method-1',
            name: 'testMethod',
            modifiers: ['public'],
            parameters: [],
            body: 'method body',
            genericName: '',
            predefinedType: [],
            objectType: [],
            startPosition: mockPosition(5),
            endPosition: mockPosition(7)
        };

        const mockClass: ClassTemporaryDetail = {
            uuid: 'class-1',
            name: 'TestClass',
            modifiers: ['public'],
            inheritance: [],
            methods: [],
            constructors: [],
            properties: [],
            body: 'class body',
            startPosition: mockPosition(1),
            endPosition: mockPosition(10)
        };

        const mockComment: Details = {
            name: '/** Test comment */',
            startPosition: mockPosition(4),
            endPosition: mockPosition(4, 20)
        };

        beforeEach(() => {
            mockMethod.comment = undefined;
        });

        it('should assign comments to nearest method', () => {
            const result = assignCommentsToMethods([mockComment], [mockMethod], [mockClass]);
            expect(result.updatedMethods[0].comment).toBe('/** Test comment */');
            expect(result.unusedComments).toHaveLength(0);
        });

        it('should handle multiple comments for same method', () => {
            const secondComment: Details = {
                name: '/** Second comment */',
                startPosition: mockPosition(4, 5),
                endPosition: mockPosition(4, 25)
            };

            const result = assignCommentsToMethods(
                [mockComment, secondComment],
                [mockMethod],
                [mockClass]
            );

            expect(result.updatedMethods[0].comment).toBe('/** Test comment */\n/** Second comment */');
            expect(result.unusedComments).toHaveLength(0);
        });

        it.skip('should not assign comments that are too far from methods', () => {
            const farComment: Details = {
                name: '/** Far comment */',
                startPosition: mockPosition(1),
                endPosition: mockPosition(1, 20)
            };

            const result = assignCommentsToMethods([farComment], [mockMethod], [mockClass]);
            expect(result.updatedMethods[0].comment).toBeUndefined();
            expect(result.unusedComments).toHaveLength(1);
        });

        it('should handle empty inputs', () => {
            const result = assignCommentsToMethods([], [], []);
            expect(result.updatedMethods).toEqual([]);
            expect(result.unusedComments).toEqual([]);
        });

        it('should not assign comments inside method body', () => {
            const insideComment: Details = {
                name: '/** Inside comment */',
                startPosition: mockPosition(6),
                endPosition: mockPosition(6, 20)
            };

            const result = assignCommentsToMethods([insideComment], [mockMethod], [mockClass]);
            expect(result.updatedMethods[0].comment).toBeUndefined();
            expect(result.unusedComments).toHaveLength(0);
        });

        it('should handle null inputs', () => {
            const result = assignCommentsToMethods(null as any, null as any, null as any);
            expect(result.updatedMethods).toEqual(null);
            expect(result.unusedComments).toEqual([]);
        });
    });
}); 