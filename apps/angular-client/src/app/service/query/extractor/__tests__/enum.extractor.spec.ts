import { EnumExtractor } from '../enum.extractor';
import { Parser, Tree, Query, QueryMatch, QueryCapture } from 'web-tree-sitter';
import { ExtractorType, EnumDetail } from '@doci/shared';

// Mock the Query class
jest.mock('web-tree-sitter', () => ({
    ...jest.requireActual('web-tree-sitter'),
    Query: jest.fn()
}));

describe('EnumExtractor', () => {
    let extractor: EnumExtractor;
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

        extractor = new EnumExtractor(mockParser);
    });

    it('should have the correct type', () => {
        expect(extractor.type).toBe(ExtractorType.Enum);
    });

    it('should extract a simple enum', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'enum.name',
                node: {
                    text: 'Direction',
                    startPosition: { row: 0, column: 5 },
                    endPosition: { row: 0, column: 14 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'enum.member.name',
                node: { text: 'Up' } as any,
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
            name: 'Direction',
            modifiers: [],
            members: [{ member: 'Up', value: undefined }],
            startPosition: { row: 0, column: 5 },
            endPosition: { row: 0, column: 14 }
        });
    });

    it('should extract enum with modifiers and multiple members', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'enum.name',
                node: {
                    text: 'Status',
                    startPosition: { row: 0, column: 14 },
                    endPosition: { row: 0, column: 20 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'enum.modifier',
                node: { text: 'public' } as any,
                patternIndex: 0
            },
            {
                name: 'enum.member.name',
                node: { text: 'Active' } as any,
                patternIndex: 0
            },
            {
                name: 'enum.member.value',
                node: { text: '1' } as any,
                patternIndex: 0
            },
            {
                name: 'enum.member.name',
                node: { text: 'Inactive' } as any,
                patternIndex: 0
            },
            {
                name: 'enum.member.value',
                node: { text: '0' } as any,
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
            name: 'Status',
            modifiers: ['public'],
            members: [
                { member: 'Active', value: '1' }
            ],
            startPosition: { row: 0, column: 14 },
            endPosition: { row: 0, column: 20 }
        });
    });

    it('should handle multiple enums with same name but different positions', () => {
        const mockCaptures1: QueryCapture[] = [
            {
                name: 'enum.name',
                node: {
                    text: 'Color',
                    startPosition: { row: 0, column: 5 },
                    endPosition: { row: 0, column: 10 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'enum.member.name',
                node: { text: 'Red' } as any,
                patternIndex: 0
            }
        ];

        const mockCaptures2: QueryCapture[] = [
            {
                name: 'enum.name',
                node: {
                    text: 'Color',
                    startPosition: { row: 10, column: 5 },
                    endPosition: { row: 10, column: 10 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'enum.member.name',
                node: { text: 'Blue' } as any,
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
        expect(result[0].members[0].member).toBe('Red');
        expect(result[1].startPosition.row).toBe(10);
        expect(result[1].members[0].member).toBe('Blue');
    });

    it('should handle enum without name capture', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'enum.member.name',
                node: { text: 'First' } as any,
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

    it('should merge members for same enum', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'enum.name',
                node: {
                    text: 'Status',
                    startPosition: { row: 0, column: 5 },
                    endPosition: { row: 0, column: 11 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'enum.member.name',
                node: { text: 'Active' } as any,
                patternIndex: 0
            },
            {
                name: 'enum.member.value',
                node: { text: '1' } as any,
                patternIndex: 0
            }
        ];

        // Call twice to simulate duplicate members
        mockQuery.matches.mockReturnValue([
            { pattern: 0, patternIndex: 0, captures: mockCaptures },
            { pattern: 0, patternIndex: 0, captures: mockCaptures }
        ]);

        const result = extractor.extract(mockTree);

        expect(result).toHaveLength(1);
        expect(result[0].members).toHaveLength(2);
        expect(result[0].members[0]).toEqual({ member: 'Active', value: '1' });
        expect(result[0].members[1]).toEqual({ member: 'Active', value: '1' });
    });

    it('should return empty array when no matches found', () => {
        mockQuery.matches.mockReturnValue([]);

        const result = extractor.extract(mockTree);

        expect(result).toEqual([]);
    });

    it('should handle enum with multiple modifiers', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'enum.name',
                node: {
                    text: 'Visibility',
                    startPosition: { row: 0, column: 20 },
                    endPosition: { row: 0, column: 30 }
                } as any,
                patternIndex: 0
            },
            {
                name: 'enum.modifier',
                node: { text: 'public' } as any,
                patternIndex: 0
            },
            {
                name: 'enum.modifier',
                node: { text: 'static' } as any,
                patternIndex: 0
            },
            {
                name: 'enum.member.name',
                node: { text: 'Visible' } as any,
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
}); 