import { ExtractorType } from "apps/cli/src/controllers/extract.types";
import { createLogger, Logger } from "apps/cli/src/shared/Logger";
import { Parser, Tree, Query } from "web-tree-sitter";

export abstract class BaseQueryEngine {
    public type: ExtractorType;
    private _logger: Logger;
    abstract extract(tree: Tree): any[] | [];

    constructor(protected parser: Parser, type: ExtractorType) {
        this.type = type;

        this._logger = createLogger(this.type);
    }

    protected runQuery(tree: Tree, queryString: string) {
        if (!this.parser.language) {
            this._logger.error('Parser language is not set');
            return [];
        }

        const query = new Query(this.parser.language, queryString);
        return query.matches(tree.rootNode);
    }
}