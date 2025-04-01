// Query/BaseQueryEngine.ts
import { Tree } from 'tree-sitter';
import { Parser } from '../../Parser/Parser';

export enum ExtractorType {
    Method = 'methods',
    MethodUsage = 'methodUsage',
    Class = 'classes',
    Function = 'functions',
    Enum = 'enums',
}

export abstract class BaseQueryEngine {
    constructor(protected parser: Parser) { }
    abstract type: ExtractorType;
    abstract extract(tree: Tree): any;

    protected runQuery(tree: Tree, query: string) {
        return this.parser.query(query).matches(tree.rootNode);
    }
}
