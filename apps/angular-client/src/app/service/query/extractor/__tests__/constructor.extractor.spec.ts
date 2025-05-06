import { ConstructorExtractor } from '../constructor.extractor';
import { Parser, Tree, Query, QueryMatch, QueryCapture } from 'web-tree-sitter';
import { ExtractorType, ConstructorMethodDetail } from '@doci/shared';

// Mock the Query class
jest.mock('web-tree-sitter', () => ({
    ...jest.requireActual('web-tree-sitter'),
    Query: jest.fn()
}));

describe('ConstructorExtractor', () => {
    let extractor: ConstructorExtractor;
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

        extractor = new ConstructorExtractor(mockParser);
    });

    it('should have the correct type', () => {
        expect(extractor.type).toBe(ExtractorType.Constructor);
    });

    it('should extract a simple constructor', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'constructor.constructor',
                node: {
                    text: 'constructor() {}',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 15 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.name',
                node: {
                    text: 'constructor',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 11 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.body',
                node: { text: '{}' } as any,
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
            name: 'constructor',
            modifiers: [],
            parameters: [],
            body: '{}',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 11 }
        });
    });

    it('should extract constructor with modifiers and parameters', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'constructor.constructor',
                node: {
                    text: 'public constructor(name: string, age: number) {}',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 45 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.modifiers',
                node: { text: 'public' } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.name',
                node: {
                    text: 'constructor',
                    startPosition: { row: 0, column: 7 },
                    endPosition: { row: 0, column: 18 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.parameter',
                node: {
                    text: 'name: string',
                    startPosition: { row: 0, column: 19 },
                    endPosition: { row: 0, column: 30 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.parameter',
                node: {
                    text: 'age: number',
                    startPosition: { row: 0, column: 19 },
                    endPosition: { row: 0, column: 30 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.body',
                node: { text: '{}' } as any,
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
            name: 'constructor',
            modifiers: ['public'],
            parameters: [
                {
                    name: 'name: string',
                    genericName: [],
                    varName: [],
                    objectType: [],
                    startPosition: { row: 0, column: 19 },
                    endPosition: { row: 0, column: 30 }
                },
                {
                    name: 'age: number',
                    genericName: [],
                    varName: [],
                    objectType: [],
                    startPosition: { row: 0, column: 19 },
                    endPosition: { row: 0, column: 30 }
                }
            ],
            body: '{}',
            startPosition: { row: 0, column: 7 },
            endPosition: { row: 0, column: 18 }
        });
    });

    it('should handle multiple constructors with same name but different positions', () => {
        const mockCaptures1: QueryCapture[] = [
            {
                name: 'constructor.constructor',
                node: {
                    text: 'constructor() {}',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 15 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.name',
                node: {
                    text: 'constructor',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 11 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.body',
                node: { text: '{}' } as any,
                patternIndex: 0
            }
        ];

        const mockCaptures2: QueryCapture[] = [
            {
                name: 'constructor.constructor',
                node: {
                    text: 'constructor(name: string) {}',
                    startPosition: { row: 2, column: 0 },
                    endPosition: { row: 2, column: 27 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.name',
                node: {
                    text: 'constructor',
                    startPosition: { row: 2, column: 0 },
                    endPosition: { row: 2, column: 11 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.parameter',
                node: {
                    text: 'name: string',
                    startPosition: { row: 2, column: 12 },
                    endPosition: { row: 2, column: 23 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.body',
                node: { text: '{}' } as any,
                patternIndex: 0
            }
        ];

        mockQuery.matches.mockReturnValue([
            { pattern: 0, patternIndex: 0, captures: mockCaptures1 },
            { pattern: 0, patternIndex: 0, captures: mockCaptures2 }
        ]);

        const result = extractor.extract(mockTree);

        expect(result).toHaveLength(2);
        expect(result[0].startPosition.row).toBe(0);
        expect(result[0].parameters).toHaveLength(0);
        expect(result[1].startPosition.row).toBe(2);
        expect(result[1].parameters).toHaveLength(1);
    });

    it('should handle constructor with multiple modifiers', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'constructor.constructor',
                node: {
                    text: 'public static constructor() {}',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 28 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.modifiers',
                node: { text: 'public' } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.modifiers',
                node: { text: 'static' } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.name',
                node: {
                    text: 'constructor',
                    startPosition: { row: 0, column: 14 },
                    endPosition: { row: 0, column: 25 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.body',
                node: { text: '{}' } as any,
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
        expect(result[0].modifiers).toEqual(['public', 'static']);
    });

    it('should handle constructor without name capture', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'constructor.constructor',
                node: {
                    text: 'constructor() {}',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 15 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.body',
                node: { text: '{}' } as any,
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

    it('should handle constructor without body capture', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'constructor.constructor',
                node: {
                    text: 'constructor()',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 13 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.name',
                node: {
                    text: 'constructor',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 11 }
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
        expect(result[0].body).toBe('');
    });

    it('should return empty array when no matches found', () => {
        mockQuery.matches.mockReturnValue([]);

        const result = extractor.extract(mockTree);

        expect(result).toEqual([]);
    });

    it('should merge parameters for same constructor', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'constructor.constructor',
                node: {
                    text: 'constructor(name: string, age: number) {}',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 40 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.name',
                node: {
                    text: 'constructor',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 11 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.parameter',
                node: {
                    text: 'name: string',
                    startPosition: { row: 0, column: 12 },
                    endPosition: { row: 0, column: 23 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.parameter',
                node: {
                    text: 'age: number',
                    startPosition: { row: 0, column: 25 },
                    endPosition: { row: 0, column: 35 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'constructor.body',
                node: { text: '{}' } as any,
                patternIndex: 0
            }
        ];

        // Call twice to simulate duplicate parameters
        mockQuery.matches.mockReturnValue([
            { pattern: 0, patternIndex: 0, captures: mockCaptures },
            { pattern: 0, patternIndex: 0, captures: mockCaptures }
        ]);

        const result = extractor.extract(mockTree);

        expect(result).toHaveLength(1);
        expect(result[0].parameters).toHaveLength(2);
        expect(result[0].parameters[0].name).toBe('name: string');
        expect(result[0].parameters[1].name).toBe('age: number');
    });
}); 