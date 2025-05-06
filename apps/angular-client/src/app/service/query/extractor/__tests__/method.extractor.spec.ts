import { MethodExtractor } from '../method.extractor';
import { Parser, Tree, Query, QueryMatch, QueryCapture } from 'web-tree-sitter';
import { ExtractorType, MethodDetail, NodePosition, ParameterDetail } from '@doci/shared';

// Mock UUID generation to have consistent test results
jest.mock('../../../../utils/utils', () => ({
    generateUUID: (prefix: string, name: string) => `${prefix}_${name}_UUID`
}));

// Mock the Query class
jest.mock('web-tree-sitter', () => ({
    ...jest.requireActual('web-tree-sitter'),
    Query: jest.fn()
}));

describe('MethodExtractor', () => {
    let extractor: MethodExtractor;
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

        extractor = new MethodExtractor(mockParser);
    });

    it('should have the correct type', () => {
        expect(extractor.type).toBe(ExtractorType.Method);
    });

    it('should extract a simple method without parameters', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'method.method',
                node: {
                    text: 'public void simpleMethod() { }',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 30 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.modifiers',
                node: { text: 'public' } as any,
                patternIndex: 0
            },
            {
                name: 'method.predefinedType.type',
                node: { text: 'void' } as any,
                patternIndex: 0
            },
            {
                name: 'method.name',
                node: {
                    text: 'simpleMethod',
                    startPosition: { row: 0, column: 12 },
                    endPosition: { row: 0, column: 23 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.body',
                node: { text: '{ }' } as any,
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
            uuid: 'METHOD_simpleMethod_UUID',
            name: 'simpleMethod',
            modifiers: ['public'],
            objectType: [],
            predefinedType: ['void'],
            genericName: undefined,
            parameters: [],
            body: '{ }',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 30 }
        });
    });

    it('should extract a complex method with all features', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'method.method',
                node: {
                    text: 'public static List<String> complexMethod(int param1, String param2) { return null; }',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 80 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.modifiers',
                node: { text: 'public' } as any,
                patternIndex: 0
            },
            {
                name: 'method.modifiers',
                node: { text: 'static' } as any,
                patternIndex: 0
            },
            {
                name: 'method.genericName',
                node: { text: 'List' } as any,
                patternIndex: 0
            },
            {
                name: 'method.identifier.type',
                node: { text: 'String' } as any,
                patternIndex: 0
            },
            {
                name: 'method.name',
                node: {
                    text: 'complexMethod',
                    startPosition: { row: 0, column: 25 },
                    endPosition: { row: 0, column: 37 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter',
                node: {
                    text: 'int param1',
                    startPosition: { row: 0, column: 38 },
                    endPosition: { row: 0, column: 47 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter',
                node: {
                    text: 'String param2',
                    startPosition: { row: 0, column: 49 },
                    endPosition: { row: 0, column: 61 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.body',
                node: { text: '{ return null; }' } as any,
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
            uuid: 'METHOD_complexMethod_UUID',
            name: 'complexMethod',
            modifiers: ['public', 'static'],
            objectType: ['String'],
            predefinedType: [],
            genericName: 'List',
            parameters: [
                {
                    name: 'int param1',
                    genericName: [],
                    varName: [],
                    objectType: [],
                    startPosition: { row: 0, column: 38 },
                    endPosition: { row: 0, column: 47 }
                },
                {
                    name: 'String param2',
                    genericName: [],
                    varName: [],
                    objectType: [],
                    startPosition: { row: 0, column: 38 },
                    endPosition: { row: 0, column: 47 }
                }
            ],
            body: '{ return null; }',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 80 }
        });
    });

    it('should handle method with multiple return types', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'method.method',
                node: {
                    text: 'public Map<String, List<Integer>> multipleTypes() { }',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 50 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.modifiers',
                node: { text: 'public' } as any,
                patternIndex: 0
            },
            {
                name: 'method.genericName',
                node: { text: 'Map' } as any,
                patternIndex: 0
            },
            {
                name: 'method.identifier.type',
                node: { text: 'String' } as any,
                patternIndex: 0
            },
            {
                name: 'method.identifier.type',
                node: { text: 'Integer' } as any,
                patternIndex: 0
            },
            {
                name: 'method.name',
                node: {
                    text: 'multipleTypes',
                    startPosition: { row: 0, column: 32 },
                    endPosition: { row: 0, column: 44 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.body',
                node: { text: '{ }' } as any,
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
        expect(result[0].objectType).toEqual(['String', 'Integer']);
        expect(result[0].genericName).toBe('Map');
    });

    it('should handle method with predefined return type', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'method.method',
                node: {
                    text: 'private int calculateSum() { }',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 30 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.modifiers',
                node: { text: 'private' } as any,
                patternIndex: 0
            },
            {
                name: 'method.predefinedType.type',
                node: { text: 'int' } as any,
                patternIndex: 0
            },
            {
                name: 'method.name',
                node: {
                    text: 'calculateSum',
                    startPosition: { row: 0, column: 12 },
                    endPosition: { row: 0, column: 23 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.body',
                node: { text: '{ }' } as any,
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
        expect(result[0].predefinedType).toEqual(['int']);
    });

    it('should handle overloaded methods', () => {
        const mockCaptures1: QueryCapture[] = [
            {
                name: 'method.method',
                node: {
                    text: 'public void process() { }',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 25 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.modifiers',
                node: { text: 'public' } as any,
                patternIndex: 0
            },
            {
                name: 'method.predefinedType.type',
                node: { text: 'void' } as any,
                patternIndex: 0
            },
            {
                name: 'method.name',
                node: {
                    text: 'process',
                    startPosition: { row: 0, column: 12 },
                    endPosition: { row: 0, column: 19 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.body',
                node: { text: '{ }' } as any,
                patternIndex: 0
            }
        ];

        const mockCaptures2: QueryCapture[] = [
            {
                name: 'method.method',
                node: {
                    text: 'public void process(String data) { }',
                    startPosition: { row: 2, column: 0 },
                    endPosition: { row: 2, column: 37 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.modifiers',
                node: { text: 'public' } as any,
                patternIndex: 0
            },
            {
                name: 'method.predefinedType.type',
                node: { text: 'void' } as any,
                patternIndex: 0
            },
            {
                name: 'method.name',
                node: {
                    text: 'process',
                    startPosition: { row: 2, column: 12 },
                    endPosition: { row: 2, column: 19 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.parameter',
                node: {
                    text: 'String data',
                    startPosition: { row: 2, column: 20 },
                    endPosition: { row: 2, column: 31 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.body',
                node: { text: '{ }' } as any,
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
        expect(result[0].name).toBe('process');
        expect(result[0].parameters).toHaveLength(0);
        expect(result[1].name).toBe('process');
        expect(result[1].parameters).toHaveLength(1);
        expect(result[1].parameters[0].name).toBe('String data');
    });

    it('should handle method without name capture', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'method.method',
                node: {
                    text: 'public void () { }',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 20 }
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

    it('should handle method with same name but different positions', () => {
        const mockCaptures1: QueryCapture[] = [
            {
                name: 'method.method',
                node: {
                    text: 'public void process() { }',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 25 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.name',
                node: {
                    text: 'process',
                    startPosition: { row: 0, column: 12 },
                    endPosition: { row: 0, column: 19 }
                } as any,
                patternIndex: 0
            }
        ];

        const mockCaptures2: QueryCapture[] = [
            {
                name: 'method.method',
                node: {
                    text: 'public void process() { }',
                    startPosition: { row: 5, column: 0 },
                    endPosition: { row: 5, column: 25 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'method.name',
                node: {
                    text: 'process',
                    startPosition: { row: 5, column: 12 },
                    endPosition: { row: 5, column: 19 }
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
        expect(result[0].name).toBe('process');
        expect(result[0].startPosition.row).toBe(0);
        expect(result[1].name).toBe('process');
        expect(result[1].startPosition.row).toBe(5);
    });
}); 