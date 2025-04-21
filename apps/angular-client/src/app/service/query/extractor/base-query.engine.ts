// Query/BaseQueryEngine.ts
import { Parser, Tree, Query } from "web-tree-sitter";

export enum ExtractorType {
    Method = 'methods',
    MethodUsage = 'methodUsage',
    Class = 'classes',
    Function = 'functions',
    Enum = 'enums',
}

export interface Details {
    name: string;
    startPosition: number;
    endPosition: number;
}


export abstract class BaseQueryEngine {
    constructor(protected parser: Parser) { }
    abstract type: ExtractorType;
    abstract extract(tree: Tree): any[] | [];

    protected runQuery(tree: Tree, queryString: string) {
        if (!this.parser.language) {
            throw new Error('Parser language is not set');
        }
        const query = new Query(this.parser.language, queryString);
        return query.matches(tree.rootNode);
    }
}