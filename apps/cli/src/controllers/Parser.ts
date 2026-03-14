import { getLanguage, isLanguageSupported } from "controllers/parser.types";
import { Parser as TreeSitterParser, Tree } from "web-tree-sitter";
import path from 'path';
import { FileSystemUtils } from 'utils/FileSystemUtils';

/**
 * Wraps web-tree-sitter's Parser.
 * `TreeSitterParser.init()` is called once per process (tracked via the static
 * flag) so multiple `Parser` instances share the same WASM initialisation.
 */
export class Parser {
    private _parser: TreeSitterParser | null = null;
    private static _wasmInitialized = false;

    /** Return the raw web-tree-sitter Parser (needed by BaseQueryEngine). */
    get treeParser(): TreeSitterParser | null {
        return this._parser;
    }

    async initialize(): Promise<void> {
        if (!Parser._wasmInitialized) {
            if (process.versions.bun) {
                const root = FileSystemUtils.getToolExecutableRoot();
                if (root) {
                    const wasmDir = path.join(root, 'wasm');
                    await TreeSitterParser.init({
                        locateFile: (name: string) => path.join(wasmDir, name),
                    });
                } else {
                    await TreeSitterParser.init();
                }
            } else {
                await TreeSitterParser.init();
            }
            Parser._wasmInitialized = true;
        }
        this._parser = new TreeSitterParser();
    }

    /**
     * Load the WASM grammar for the given language and set it on the parser.
     * @param language - Case-insensitive language name as returned by LANGUAGE_MAP
     *                   (e.g. "TypeScript", "JavaScript").
     */
    async setLanguage(language: string): Promise<void> {
        if (!this._parser) {
            throw new Error('Parser not initialised. Call initialize() first.');
        }
        const lang = await getLanguage(language);
        this._parser.setLanguage(lang);
    }

    /** Returns true if this parser currently has a language loaded. */
    get hasLanguage(): boolean {
        return this._parser?.language != null;
    }

    parse(code: string): Tree | null {
        if (!this._parser) return null;
        return this._parser.parse(code);
    }
}