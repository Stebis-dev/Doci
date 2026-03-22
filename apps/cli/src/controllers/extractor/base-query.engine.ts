import { ExtractorType } from "@doci/types";
import { createLogger, Logger } from "utils";
import type { Parser, Tree } from "web-tree-sitter";
import { Query } from "web-tree-sitter";
import type { LanguageDialect, TreeSitterQuery } from "./query-builder/query";
import { serializeQuery } from "./query-builder/query";

export abstract class BaseQueryEngine {
    public type: ExtractorType;
    protected dialect: LanguageDialect;
    private _logger: Logger;
    abstract extract(tree: Tree): any[] | [];

    constructor(protected parser: Parser, type: ExtractorType, dialect: LanguageDialect) {
        this.type = type;
        this.dialect = dialect;
        this._logger = createLogger(this.type);
    }

    /** Run a typed query built with the `Q` builder. */
    protected runTypedQuery(tree: Tree, query: TreeSitterQuery) {
        return this.runQuery(tree, serializeQuery(query));
    }

    /** Low-level escape hatch — prefer `runTypedQuery` for new code. */
    protected runQuery(tree: Tree, queryString: string) {
        if (!this.parser.language) {
            this._logger.error('Parser language is not set');
            return [];
        }

        const query = new Query(this.parser.language, queryString);
        return query.matches(tree.rootNode);
    }
}