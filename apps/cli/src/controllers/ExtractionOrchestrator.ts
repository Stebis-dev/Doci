import { Parser } from "controllers/Parser";
import { extractDetails } from "controllers/extractDetails";
import { ExtractedDetails } from "controllers/extract.types";
import { isLanguageSupported } from "controllers/parser.types";
import { ScanDepth } from "commands/scan/scan.constants";
import { Utils, createLogger } from "utils";

const logger = createLogger('ExtractionOrchestrator');

/** Files larger than this threshold are skipped to avoid memory pressure. */
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

export interface ExtractionResult {
    symbols: ExtractedDetails | null;
    /** New status for the FileMetadata entry (may override the scan-phase value). */
    status: 'processed' | 'skipped' | 'failed';
    error: string | null;
}

/**
 * Orchestrates per-file semantic extraction.
 *
 * The underlying Parser instance is shared and reused across files.
 * `TreeSitterParser.init()` is called exactly once per process (tracked inside
 * the Parser class itself).
 */
export class ExtractionOrchestrator {
    private static _parser: Parser | null = null;

    private static async _getParser(): Promise<Parser> {
        if (!ExtractionOrchestrator._parser) {
            const p = new Parser();
            await p.initialize();
            ExtractionOrchestrator._parser = p;
        }
        return ExtractionOrchestrator._parser;
    }

    /**
     * Extract semantic symbols from a single file.
     *
     * @param filePath - Absolute path to the source file
     * @param language - Language display name as stored in FileMetadata (e.g. "TypeScript")
     * @param depth    - 'symbols' for names + positions; 'full' additionally includes bodies
     */
    static async extractFromFile(
        filePath: string,
        language: string,
        depth: ScanDepth,
    ): Promise<ExtractionResult> {

        // ── 1. Language guard ────────────────────────────────────────────────
        if (!isLanguageSupported(language)) {
            return {
                symbols: null,
                status: 'skipped',
                error: `No parser available for language: ${language}`,
            };
        }

        // ── 2. Size guard ────────────────────────────────────────────────────
        let sizeBytes = 0;
        try {
            sizeBytes = Utils.getFileSizeBytes(filePath);
        } catch {
            // If we can't stat, let the read below fail and be caught
        }

        if (sizeBytes > MAX_FILE_SIZE_BYTES) {
            return {
                symbols: null,
                status: 'skipped',
                error: `File exceeds ${MAX_FILE_SIZE_BYTES / 1024}KB size limit (${sizeBytes} bytes)`,
            };
        }

        // ── 3. Parse + extract ────────────────────────────────────────────────
        try {
            const parser = await ExtractionOrchestrator._getParser();
            await parser.setLanguage(language);

            const code = Utils.readFileSync(filePath);
            const tree = parser.parse(code);

            if (!tree) {
                return { symbols: null, status: 'failed', error: 'tree-sitter returned null tree' };
            }

            const treeParser = parser.treeParser;
            if (!treeParser) {
                return { symbols: null, status: 'failed', error: 'Underlying TreeSitterParser unavailable' };
            }

            const symbols = extractDetails(tree, treeParser, filePath, depth);
            return { symbols, status: 'processed', error: null };

        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warn(`Extraction failed for ${filePath}: ${message}`);
            return { symbols: null, status: 'failed', error: message };
        }
    }

    /** Reset the shared parser (mainly for testing). */
    static reset(): void {
        ExtractionOrchestrator._parser = null;
    }
}
