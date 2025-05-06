import { PropertyExtractor } from '../property.extractor';
import { Parser, Tree, Query, QueryMatch, QueryCapture } from 'web-tree-sitter';
import { ExtractorType, PropertyDetail } from '@doci/shared';

// Mock the Query class
jest.mock('web-tree-sitter', () => ({
    ...jest.requireActual('web-tree-sitter'),
    Query: jest.fn()
}));

describe('PropertyExtractor', () => {
    let extractor: PropertyExtractor;
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

        extractor = new PropertyExtractor(mockParser);
    });

    it('should have the correct type', () => {
        expect(extractor.type).toBe(ExtractorType.Property);
    });

    it('should extract a simple property with predefined type', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'property.name',
                node: {
                    text: 'count',
                    startPosition: { row: 0, column: 11 },
                    endPosition: { row: 0, column: 16 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'property.predefinedType.type',
                node: { text: 'number' } as any,
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
            name: 'count',
            modifiers: [],
            genericName: undefined,
            predefinedType: ['number'],
            objectType: [],
            startPosition: { row: 0, column: 11 },
            endPosition: { row: 0, column: 16 }
        });
    });

    it('should extract property with modifiers and identifier type', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'property.name',
                node: {
                    text: 'user',
                    startPosition: { row: 0, column: 19 },
                    endPosition: { row: 0, column: 23 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'property.modifier',
                node: { text: 'private' } as any,
                patternIndex: 0
            },
            {
                name: 'property.identifier.type',
                node: { text: 'User' } as any,
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
            name: 'user',
            modifiers: ['private'],
            genericName: undefined,
            predefinedType: [],
            objectType: ['User'],
            startPosition: { row: 0, column: 19 },
            endPosition: { row: 0, column: 23 }
        });
    });

    it('should extract property with generic type', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'property.name',
                node: {
                    text: 'items',
                    startPosition: { row: 0, column: 24 },
                    endPosition: { row: 0, column: 29 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'property.genericName',
                node: { text: 'Array' } as any,
                patternIndex: 0
            },
            {
                name: 'property.predefinedType.type',
                node: { text: 'string' } as any,
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
            name: 'items',
            modifiers: [],
            genericName: 'Array',
            predefinedType: ['string'],
            objectType: [],
            startPosition: { row: 0, column: 24 },
            endPosition: { row: 0, column: 29 }
        });
    });

    it('should extract property with generic type and identifier type argument', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'property.name',
                node: {
                    text: 'users',
                    startPosition: { row: 0, column: 24 },
                    endPosition: { row: 0, column: 29 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'property.genericName',
                node: { text: 'Array' } as any,
                patternIndex: 0
            },
            {
                name: 'property.identifier.type',
                node: { text: 'User' } as any,
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
            name: 'users',
            modifiers: [],
            genericName: 'Array',
            predefinedType: [],
            objectType: ['User'],
            startPosition: { row: 0, column: 24 },
            endPosition: { row: 0, column: 29 }
        });
    });

    it('should handle multiple properties with same name but different positions', () => {
        const mockCaptures1: QueryCapture[] = [
            {
                name: 'property.name',
                node: {
                    text: 'id',
                    startPosition: { row: 0, column: 11 },
                    endPosition: { row: 0, column: 13 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'property.predefinedType.type',
                node: { text: 'number' } as any,
                patternIndex: 0
            }
        ];

        const mockCaptures2: QueryCapture[] = [
            {
                name: 'property.name',
                node: {
                    text: 'id',
                    startPosition: { row: 10, column: 11 },
                    endPosition: { row: 10, column: 13 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'property.predefinedType.type',
                node: { text: 'string' } as any,
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
        expect(result[0].predefinedType).toEqual(['number']);
        expect(result[1].startPosition.row).toBe(10);
        expect(result[1].predefinedType).toEqual(['string']);
    });

    it('should handle property without name capture', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'property.predefinedType.type',
                node: { text: 'string' } as any,
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

    it('should merge types for same property', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'property.name',
                node: {
                    text: 'data',
                    startPosition: { row: 0, column: 11 },
                    endPosition: { row: 0, column: 15 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'property.predefinedType.type',
                node: { text: 'string' } as any,
                patternIndex: 0
            }
        ];

        mockQuery.matches.mockReturnValue([
            { pattern: 0, patternIndex: 0, captures: mockCaptures },
            { pattern: 0, patternIndex: 0, captures: mockCaptures }
        ]);

        const result = extractor.extract(mockTree);

        expect(result).toHaveLength(1);
        expect(result[0].predefinedType).toEqual(['string', 'string']);
    });

    it('should return empty array when no matches found', () => {
        mockQuery.matches.mockReturnValue([]);

        const result = extractor.extract(mockTree);

        expect(result).toEqual([]);
    });

    it('should handle multiple modifiers', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'property.name',
                node: {
                    text: 'config',
                    startPosition: { row: 0, column: 25 },
                    endPosition: { row: 0, column: 31 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'property.modifier',
                node: { text: 'private' } as any,
                patternIndex: 0
            },
            {
                name: 'property.modifier',
                node: { text: 'readonly' } as any,
                patternIndex: 0
            },
            {
                name: 'property.identifier.type',
                node: { text: 'Config' } as any,
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
        expect(result[0].modifiers).toEqual(['private', 'readonly']);
    });
}); 