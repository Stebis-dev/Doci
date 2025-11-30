import { getLanguage } from "apps/cli/src/controllers/parser.types";
import { Language, Parser, Tree } from "web-tree-sitter";


export class TreeSitterParser {
    protected parser: Parser | null = null;

    async initialize(language: string): Promise<void> {
        // Initialize the parser
        await Parser.init();

        this.parser = new Parser();
        this.parser.setLanguage(getLanguage(language));
    }

    parse(code: string): Tree | null {
        if (!this.parser) {
            return null;
        }

        return this.parser.parse(code);
    }
}