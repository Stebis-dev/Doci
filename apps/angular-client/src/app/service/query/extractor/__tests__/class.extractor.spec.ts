import { ClassExtractor } from '../class.extractor';
import { Parser, Tree, Query, QueryMatch, QueryCapture } from 'web-tree-sitter';
import { ClassTemporaryDetail, ExtractorType, NodePosition } from '@doci/shared';

// Mock UUID generation to have consistent test results
jest.mock('../../../../utils/utils', () => ({
    generateUUID: (prefix: string, name: string) => `${prefix}_${name}_UUID`
}));

// Mock the Query class
jest.mock('web-tree-sitter', () => ({
    ...jest.requireActual('web-tree-sitter'),
    Query: jest.fn()
}));

describe('ClassExtractor', () => {
    let extractor: ClassExtractor;
    let mockParser: jest.Mocked<Parser>;
    let mockTree: jest.Mocked<Tree>;
    let mockQuery: jest.Mocked<Query>;
    let mockLanguage: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockLanguage = {
            query: jest.fn()
        };

        mockQuery = {
            matches: jest.fn()
        } as unknown as jest.Mocked<Query>;

        mockTree = {
            rootNode: {}
        } as unknown as jest.Mocked<Tree>;

        mockParser = {
            language: mockLanguage
        } as unknown as jest.Mocked<Parser>;

        (Query as jest.Mock).mockImplementation(() => mockQuery);

        extractor = new ClassExtractor(mockParser);
    });

    it('should have the correct type', () => {
        expect(extractor.type).toBe(ExtractorType.Class);
    });

    it('should extract a simple class without any members', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'class',
                node: {
                    text: 'class SimpleClass {}',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 20 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'class.name',
                node: {
                    text: 'SimpleClass',
                    startPosition: { row: 0, column: 6 },
                    endPosition: { row: 0, column: 16 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'class.body',
                node: {
                    text: '{}',
                    startPosition: { row: 0, column: 17 },
                    endPosition: { row: 0, column: 19 }
                } as any,
                patternIndex: 0
            }
        ];

        mockQuery.matches.mockReturnValue([{
            pattern: 0,
            patternIndex: 0,
            captures: mockCaptures
        }]);

        const result = extractor.extract(mockTree);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            uuid: 'CLASS_SimpleClass_UUID',
            name: 'SimpleClass',
            modifiers: [],
            inheritance: [],
            properties: [],
            constructors: [],
            methods: [],
            body: '{}',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 20 }
        });
    });

    it('should extract a complex class with all features', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'class',
                node: {
                    text: 'public class ComplexClass extends BaseClass { ... }',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 10, column: 1 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'class.modifier',
                node: { text: 'public' } as any,
                patternIndex: 0
            },
            {
                name: 'class.name',
                node: {
                    text: 'ComplexClass',
                    startPosition: { row: 0, column: 13 },
                    endPosition: { row: 0, column: 24 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'class.inheritance',
                node: { text: 'BaseClass' } as any,
                patternIndex: 0
            },
            {
                name: 'class.constructor',
                node: { text: 'ComplexClass' } as any,
                patternIndex: 0
            },
            {
                name: 'class.method',
                node: { text: 'method1' } as any,
                patternIndex: 0
            },
            {
                name: 'class.method',
                node: { text: 'method2' } as any,
                patternIndex: 0
            },
            {
                name: 'class.property.name',
                node: { text: 'property1' } as any,
                patternIndex: 0
            },
            {
                name: 'class.property.name',
                node: { text: 'property2' } as any,
                patternIndex: 0
            },
            {
                name: 'class.body',
                node: {
                    text: '{ ... }',
                    startPosition: { row: 0, column: 42 },
                    endPosition: { row: 10, column: 1 }
                } as any,
                patternIndex: 0
            }
        ];

        mockQuery.matches.mockReturnValue([{
            pattern: 0,
            patternIndex: 0,
            captures: mockCaptures
        }]);

        const result = extractor.extract(mockTree);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            uuid: 'CLASS_ComplexClass_UUID',
            name: 'ComplexClass',
            modifiers: ['public'],
            inheritance: ['BaseClass'],
            properties: [
                { name: 'property1' },
                { name: 'property2' }
            ],
            constructors: [{ name: 'ComplexClass' }],
            methods: [
                { name: 'method1' },
                { name: 'method2' }
            ],
            body: '{ ... }',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 10, column: 1 }
        });
    });

    it('should handle multiple classes in the same file', () => {
        const mockCaptures1: QueryCapture[] = [
            {
                name: 'class',
                node: {
                    text: 'class Class1 {}',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 15 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'class.name',
                node: {
                    text: 'Class1',
                    startPosition: { row: 0, column: 6 },
                    endPosition: { row: 0, column: 12 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'class.body',
                node: {
                    text: '{}',
                    startPosition: { row: 0, column: 13 },
                    endPosition: { row: 0, column: 15 }
                } as any,
                patternIndex: 0
            }
        ];

        const mockCaptures2: QueryCapture[] = [
            {
                name: 'class',
                node: {
                    text: 'class Class2 {}',
                    startPosition: { row: 2, column: 0 },
                    endPosition: { row: 2, column: 15 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'class.name',
                node: {
                    text: 'Class2',
                    startPosition: { row: 2, column: 6 },
                    endPosition: { row: 2, column: 12 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'class.body',
                node: {
                    text: '{}',
                    startPosition: { row: 2, column: 13 },
                    endPosition: { row: 2, column: 15 }
                } as any,
                patternIndex: 0
            }
        ];

        mockQuery.matches.mockReturnValue([
            {
                pattern: 0,
                patternIndex: 0,
                captures: mockCaptures1
            },
            {
                pattern: 0,
                patternIndex: 0,
                captures: mockCaptures2
            }
        ]);

        const result = extractor.extract(mockTree);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Class1');
        expect(result[1].name).toBe('Class2');
    });

    it('should handle class with multiple modifiers', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'class',
                node: {
                    text: 'public static abstract class MultiModClass {}',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 40 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'class.modifier',
                node: { text: 'public' } as any,
                patternIndex: 0
            },
            {
                name: 'class.modifier',
                node: { text: 'static' } as any,
                patternIndex: 0
            },
            {
                name: 'class.modifier',
                node: { text: 'abstract' } as any,
                patternIndex: 0
            },
            {
                name: 'class.name',
                node: {
                    text: 'MultiModClass',
                    startPosition: { row: 0, column: 24 },
                    endPosition: { row: 0, column: 36 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'class.body',
                node: {
                    text: '{}',
                    startPosition: { row: 0, column: 37 },
                    endPosition: { row: 0, column: 39 }
                } as any,
                patternIndex: 0
            }
        ];

        mockQuery.matches.mockReturnValue([{
            pattern: 0,
            patternIndex: 0,
            captures: mockCaptures
        }]);

        const result = extractor.extract(mockTree);

        expect(result).toHaveLength(1);
        expect(result[0].modifiers).toEqual(['public', 'static', 'abstract']);
    });

    it('should handle class with duplicate method names', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'class',
                node: {
                    text: 'class DuplicateMethods { ... }',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 5, column: 1 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'class.name',
                node: {
                    text: 'DuplicateMethods',
                    startPosition: { row: 0, column: 6 },
                    endPosition: { row: 0, column: 21 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'class.method',
                node: { text: 'process' } as any,
                patternIndex: 0
            },
            {
                name: 'class.method',
                node: { text: 'process' } as any,
                patternIndex: 0
            },
            {
                name: 'class.body',
                node: {
                    text: '{ ... }',
                    startPosition: { row: 0, column: 22 },
                    endPosition: { row: 5, column: 1 }
                } as any,
                patternIndex: 0
            }
        ];

        mockQuery.matches.mockReturnValue([{
            pattern: 0,
            patternIndex: 0,
            captures: mockCaptures
        }]);

        const result = extractor.extract(mockTree);

        expect(result).toHaveLength(1);
        expect(result[0].methods).toEqual([
            { name: 'process' },
            { name: 'process' }
        ]);
    });

    it('should handle class without name capture', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'class',
                node: {
                    text: 'class {}',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 9 }
                } as any,
                patternIndex: 0
            }
        ];

        mockQuery.matches.mockReturnValue([{
            pattern: 0,
            patternIndex: 0,
            captures: mockCaptures
        }]);

        const result = extractor.extract(mockTree);

        expect(result).toHaveLength(0);
    });

    it('should return empty array when no matches found', () => {
        mockQuery.matches.mockReturnValue([]);

        const result = extractor.extract(mockTree);

        expect(result).toEqual([]);
    });
}); 