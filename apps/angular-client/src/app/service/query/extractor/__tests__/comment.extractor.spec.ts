import { CommentsExtractor } from '../comment.extractor';
import { Parser, Tree, Query, QueryMatch, QueryCapture } from 'web-tree-sitter';
import { ExtractorType, Details } from '@doci/shared';

// Mock the Query class
jest.mock('web-tree-sitter', () => ({
    ...jest.requireActual('web-tree-sitter'),
    Query: jest.fn()
}));

describe('CommentsExtractor', () => {
    let extractor: CommentsExtractor;
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

        extractor = new CommentsExtractor(mockParser);
    });

    it('should have the correct type', () => {
        expect(extractor.type).toBe(ExtractorType.Comments);
    });

    it('should extract a simple comment', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'comments',
                node: {
                    text: '// This is a comment',
                    startPosition: { row: 0, column: 0 },
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
            name: 'This is a comment',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 19 }
        });
    });

    it('should handle multiple comments with same content but different positions', () => {
        const mockCaptures1: QueryCapture[] = [
            {
                name: 'comments',
                node: {
                    text: '// TODO: Fix this',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 15 }
                } as any,
                patternIndex: 0
            }
        ];

        const mockCaptures2: QueryCapture[] = [
            {
                name: 'comments',
                node: {
                    text: '// TODO: Fix this',
                    startPosition: { row: 10, column: 0 },
                    endPosition: { row: 10, column: 15 }
                } as any,
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
        expect(result[1].startPosition.row).toBe(10);
        expect(result[0].name).toBe('TODO: Fix this');
        expect(result[1].name).toBe('TODO: Fix this');
    });

    it('should handle XML-style summary comments', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'comments',
                node: {
                    text: '// <summary>Method description</summary>',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 37 }
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
        expect(result[0].name).toBe('Method description');
    });

    it('should handle multi-slash comments', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'comments',
                node: {
                    text: '/// Triple slash comment',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 23 }
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
        expect(result[0].name).toBe('Triple slash comment');
    });

    it('should ignore empty comments after formatting', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'comments',
                node: {
                    text: '// <summary></summary>',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 21 }
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

    it('should handle comment without comments capture', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'not_comments',
                node: {
                    text: '// This should be ignored',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 24 }
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

    it('should handle comments with only whitespace', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'comments',
                node: {
                    text: '//    ',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 6 }
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

    it('should handle comments with mixed summary tags', () => {
        const mockCaptures: QueryCapture[] = [
            {
                name: 'comments',
                node: {
                    text: '// <summary>First part</summary> Additional text',
                    startPosition: { row: 0, column: 0 },
                    endPosition: { row: 0, column: 45 }
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
        expect(result[0].name).toBe('First part Additional text');
    });
}); 