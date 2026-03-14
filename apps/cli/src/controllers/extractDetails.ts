import type { ExtractedDetails } from "@doci/types";
import { ExtractorType } from "@doci/types";
import { ScanDepth } from "commands/scan/scan.constants";
import { ClassExtractor } from "controllers/extractor/class.extractor";
import { CommentsExtractor } from "controllers/extractor/comment.extractor";
import { ConstructorExtractor } from "controllers/extractor/constructor.extractor";
import { EnumExtractor } from "controllers/extractor/enum.extractor";
import { MethodExtractor } from "controllers/extractor/method.extractor";
import { ParameterExtractor } from "controllers/extractor/parameter.extractor";
import { PropertyExtractor } from "controllers/extractor/property.extractor";
import { createLogger } from "utils";
import type { Parser, Tree } from "web-tree-sitter";

const logger = createLogger('ExtractDetails');

/**
 * Run all extractors against the parsed AST and return a populated
 * {@link ExtractedDetails} object.
 *
 * @param ast       - Parsed Tree from web-tree-sitter
 * @param parser    - The underlying web-tree-sitter Parser (with language set)
 * @param filePath  - Absolute path to the source file (stored in the result)
 * @param depth     - Extraction depth; 'symbols' skips body text, 'full' includes it
 */
export function extractDetails(
    ast: Tree,
    parser: Parser,
    filePath: string,
    depth: ScanDepth = ScanDepth.SYMBOLS,
): ExtractedDetails {
    const result: ExtractedDetails = { filePath };

    const extractors = [
        { type: ExtractorType.Class, instance: new ClassExtractor(parser, ExtractorType.Class) },
        { type: ExtractorType.Property, instance: new PropertyExtractor(parser, ExtractorType.Property) },
        { type: ExtractorType.Method, instance: new MethodExtractor(parser, ExtractorType.Method) },
        { type: ExtractorType.Constructor, instance: new ConstructorExtractor(parser, ExtractorType.Constructor) },
        { type: ExtractorType.Enum, instance: new EnumExtractor(parser, ExtractorType.Enum) },
        { type: ExtractorType.Parameter, instance: new ParameterExtractor(parser, ExtractorType.Parameter) },
        ...(depth === ScanDepth.FULL
            ? [{ type: ExtractorType.Comments, instance: new CommentsExtractor(parser, ExtractorType.Comments) }]
            : []),
    ];

    for (const { type, instance } of extractors) {
        try {
            const extracted = instance.extract(ast);
            if (extracted.length > 0) {
                (result as any)[type] = depth === ScanDepth.SYMBOLS
                    ? stripBodies(extracted)
                    : extracted;
            }
        } catch (err) {
            logger.warn(`Extractor ${type} failed for ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    return result;
}

/**
 * For `--depth symbols`, strip `body` text from extracted items to keep
 * the output lightweight while still preserving names and positions.
 */
function stripBodies(items: any[]): any[] {
    if (!Array.isArray(items)) return items;
    return items.map(item => {
        if (typeof item !== 'object' || item === null) return item;
        const copy = { ...item };
        if ('body' in copy) copy.body = '';
        return copy;
    });
}

