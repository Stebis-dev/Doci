// Query/BaseQueryEngine.ts
import { ExtractorType } from "@doci/types";
import type { Parser, Tree } from "web-tree-sitter";
import { Query } from "web-tree-sitter";


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