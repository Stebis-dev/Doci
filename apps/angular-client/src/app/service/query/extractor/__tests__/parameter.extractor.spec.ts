import { ParameterExtractor } from '../parameter.extractor';
import { Parser, Tree, Query, QueryMatch, QueryCapture } from 'web-tree-sitter';
import { ExtractorType, ParameterDetail } from '@doci/shared';

// Mock the Query class
jest.mock('web-tree-sitter', () => ({
    ...jest.requireActual('web-tree-sitter'),
    Query: jest.fn()
}));

describe('ParameterExtractor', () => {
    let extractor: ParameterExtractor;
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

        extractor = new ParameterExtractor(mockParser);
    });

    it('should have the correct type', () => {
        expect(extractor.type).toBe(ExtractorType.Parameter);
    });

    it('should extract a simple parameter with predefined type', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'method.parameter',
                node: {
                    text: 'int count',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 9 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.type',
                node: { text: 'int' } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.name',
                node: { text: 'count' } as any,
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
            name: 'int count',
            varName: ['count'],
            genericName: [],
            objectType: ['int'],
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 9 }
        });
    });

    it('should extract a parameter with generic type', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'method.parameter',
                node: {
                    text: 'List<String> items',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 17 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.genericName',
                node: { text: 'List' } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.type',
                node: { text: 'String' } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.name',
                node: { text: 'items' } as any,
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
            name: 'List<String> items',
            varName: ['items'],
            genericName: ['List'],
            objectType: ['String'],
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 17 }
        });
    });

    it('should extract a parameter with complex generic types', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'method.parameter',
                node: {
                    text: 'Map<String, List<Integer>> dataMap',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 32 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.genericName',
                node: { text: 'Map' } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.type',
                node: { text: 'String' } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.type',
                node: { text: 'Integer' } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.name',
                node: { text: 'dataMap' } as any,
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
            name: 'Map<String, List<Integer>> dataMap',
            varName: ['dataMap'],
            genericName: ['Map'],
            objectType: ['String', 'Integer'],
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 32 }
        });
    });

    it('should handle multiple parameters with same name but different positions', () => {
        const mockCaptures1: QueryCapture[] = [
            {
                name: 'method.parameter',
                node: {
                    text: 'String data',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 11 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.type',
                node: { text: 'String' } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.name',
                node: { text: 'data' } as any,
                patternIndex: 0
            }
        ];

        const mockCaptures2: QueryCapture[] = [
            {
                name: 'method.parameter',
                node: {
                    text: 'String data',
                    startPosition: { row: 2, column: 0 },
                    endPosition: { row: 2, column: 11 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.type',
                node: { text: 'String' } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.name',
                node: { text: 'data' } as any,
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
        expect(result[0].name).toBe('String data');
        expect(result[0].startPosition.row).toBe(0);
        expect(result[1].name).toBe('String data');
        expect(result[1].startPosition.row).toBe(2);
    });

    it('should handle parameter with multiple type arguments', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'method.parameter',
                node: {
                    text: 'Pair<Integer, String> pair',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 25 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.genericName',
                node: { text: 'Pair' } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.type',
                node: { text: 'Integer' } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.type',
                node: { text: 'String' } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.name',
                node: { text: 'pair' } as any,
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
            name: 'Pair<Integer, String> pair',
            varName: ['pair'],
            genericName: ['Pair'],
            objectType: ['Integer', 'String'],
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 25 }
        });
    });

    it('should handle parameter without type capture', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'method.parameter',
                node: {
                    text: 'data',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 4 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.name',
                node: { text: 'data' } as any,
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
            name: 'data',
            varName: ['data'],
            genericName: [],
            objectType: [],
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 4 }
        });
    });

    it('should handle parameter with same type and name in different methods', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'method.parameter',
                node: {
                    text: 'String data',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 11 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.type',
                node: { text: 'String' } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.name',
                node: { text: 'data' } as any,
                patternIndex: 0
            }
        ];

        // Simulate the same parameter in two different methods
        mockQuery.matches.mockReturnValue([
            {
                pattern: 0,
                patternIndex: 0,
                captures: mockCaptures
            }
        ]);

        const result = extractor.extract(mockTree);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'String data',
            varName: ['data'],
            objectType: ['String'],
            genericName: [],
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 11 }
        });
    });

    it('should return empty array when no matches found', () => {
        mockQuery.matches.mockReturnValue([]);

        const result = extractor.extract(mockTree);

        expect(result).toEqual([]);
    });

    it('should handle parameter without name capture', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'method.parameter',
                node: {
                    text: 'String',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 6 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter.type',
                node: { text: 'String' } as any,
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
            name: 'String',
            varName: [],
            genericName: [],
            objectType: ['String'],
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 6 }
        });
    });
}); 