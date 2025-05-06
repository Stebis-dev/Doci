import { BaseQueryEngine } from '../base-query.engine';
import { ExtractorType } from '@doci/shared';
import { Parser, Tree, Query, QueryMatch } from 'web-tree-sitter';

// Mock the Query class
jest.mock('web-tree-sitter', () => ({
    ...jest.requireActual('web-tree-sitter'),
    Query: jest.fn()
}));

// Create a concrete implementation for testing
class TestQueryEngine extends BaseQueryEngine {
    type = ExtractorType.Class;
    extract(tree: Tree): QueryMatch[] {
        const queryString = '(class_declaration) @class';
        return this.runQuery(tree, queryString);
    }
}

describe('BaseQueryEngine', () => {
    let engine: TestQueryEngine;
    let mockParser: jest.Mocked<Parser>;
    let mockTree: jest.Mocked<Tree>;
    let mockQuery: jest.Mocked<Query>;
    let mockLanguage: any;

    beforeEach(() => {
        // Reset all mocks
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

        // Setup Query constructor mock
        (Query as jest.Mock).mockImplementation(() => mockQuery);

        engine = new TestQueryEngine(mockParser);
    });

    describe('runQuery', () => {
        it('should successfully run a query on the tree', () => {
            const mockNode = {
                type: 'class_declaration',
                text: 'class TestClass {}',
                startPosition: { row: 0, column: 0 },
                endPosition: { row: 0, column: 20 }
            };

            const expectedMatches = [{
                pattern: 0,
                index: 0,
                captures: [],
                match: mockNode
            }] as unknown as QueryMatch[];

            mockQuery.matches.mockReturnValue(expectedMatches);

            const result = engine.extract(mockTree);

            expect(Query).toHaveBeenCalledWith(mockLanguage, '(class_declaration) @class');
            expect(mockQuery.matches).toHaveBeenCalledWith(mockTree.rootNode);
            expect(result).toBe(expectedMatches);
        });

        it('should throw error when parser language is not set', () => {
            mockParser.language = null;

            expect(() => engine.extract(mockTree)).toThrow('Parser language is not set');
        });
    });

    describe('type property', () => {
        it('should return the correct extractor type', () => {
            expect(engine.type).toBe(ExtractorType.Class);
        });
    });

    describe('extract method', () => {
        it('should return empty array when no matches found', () => {
            mockQuery.matches.mockReturnValue([]);

            const result = engine.extract(mockTree);

            expect(result).toEqual([]);
        });

        it('should handle complex query results', () => {
            const mockTestClass = {
                type: 'class_declaration',
                text: 'class TestClass {}',
                startPosition: { row: 0, column: 0 },
                endPosition: { row: 0, column: 20 }
            };

            const mockAnotherClass = {
                type: 'class_declaration',
                text: 'class AnotherClass {}',
                startPosition: { row: 2, column: 0 },
                endPosition: { row: 2, column: 23 }
            };

            const complexMatches = [
                {
                    pattern: 0,
                    index: 0,
                    captures: [],
                    match: mockTestClass
                },
                {
                    pattern: 0,
                    index: 0,
                    captures: [],
                    match: mockAnotherClass
                }
            ] as unknown as QueryMatch[];

            mockQuery.matches.mockReturnValue(complexMatches);

            const result = engine.extract(mockTree);

            expect(result).toBe(complexMatches);
            expect(mockQuery.matches).toHaveBeenCalledWith(mockTree.rootNode);
        });
    });

    describe('error handling', () => {
        it('should handle query creation errors', () => {
            (Query as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Invalid query syntax');
            });

            expect(() => engine.extract(mockTree)).toThrow('Invalid query syntax');
        });

        it('should handle query execution errors', () => {
            mockQuery.matches.mockImplementation(() => {
                throw new Error('Query execution failed');
            });

            expect(() => engine.extract(mockTree)).toThrow('Query execution failed');
        });
    });
}); 