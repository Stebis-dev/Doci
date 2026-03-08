import { getLanguage } from "controllers/parser.types";
import { Language, Parser as TreeSitterParser, Tree } from "web-tree-sitter";


export class Parser {
    protected parser: TreeSitterParser | null = null;
    constructor() {
        console.log('TreeSitterParser instance created');
    }

    async initialize(): Promise<void> {
        // Initialize the parser
        await TreeSitterParser.init({
            // locateFile(path: string) {
            //     // Bun-compiled exe does NOT have paths like ./ or import.meta.url
            //     // So we force a relative lookup next to the executable

            //     return `./${path}`;
            // }
        });

        this.parser = new TreeSitterParser();
        // this.parser.setLanguage(await getLanguage(language));
    }

    parse(code: string): Tree | null {
        if (!this.parser) {
            return null;
        }

        return this.parser.parse(code);
    }
}