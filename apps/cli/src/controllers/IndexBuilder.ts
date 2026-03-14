import { ExtractedDetails, ExtractorType } from "controllers/extract.types";

/**
 * Builds a flat, sorted symbol index from an array of FileMetadata entries.
 *
 * Each entry in the returned array represents one named symbol (class, method,
 * constructor, property, or enum) and carries enough information for an LLM
 * or a frontend search UI to locate the symbol without re-parsing the source.
 *
 * Output is sorted lexicographically by filePath then symbolName so diffs and
 * output comparisons are deterministic.
 */
export class IndexBuilder {
    static buildIndex(files: FileMetadata[]): IndexEntry[] {
        const entries: IndexEntry[] = [];

        for (const file of files) {
            if (!file.symbols) continue;

            const symbols = file.symbols as ExtractedDetails;
            const fp = file.filePath;

            // ── Classes ───────────────────────────────────────────────────────
            for (const cls of symbols[ExtractorType.Class] ?? []) {
                entries.push(makeEntry(cls.name, 'class', fp, cls.startPosition.row, cls.endPosition.row, cls.comment));
            }

            // ── Methods ───────────────────────────────────────────────────────
            for (const method of symbols[ExtractorType.Method] ?? []) {
                entries.push(makeEntry(method.name, 'method', fp, method.startPosition.row, method.endPosition.row, method.comment));
            }

            // ── Constructors ──────────────────────────────────────────────────
            for (const ctor of symbols[ExtractorType.Constructor] ?? []) {
                entries.push(makeEntry(ctor.name, 'constructor', fp, ctor.startPosition.row, ctor.endPosition.row, null));
            }

            // ── Properties ───────────────────────────────────────────────────
            for (const prop of symbols[ExtractorType.Property] ?? []) {
                entries.push(makeEntry(prop.name, 'property', fp, prop.startPosition.row, prop.endPosition.row, null));
            }

            // ── Enums ─────────────────────────────────────────────────────────
            for (const enumDef of symbols[ExtractorType.Enum] ?? []) {
                entries.push(makeEntry(enumDef.name, 'enum', fp, enumDef.startPosition.row, enumDef.endPosition.row, null));
            }
        }

        return entries.sort((a, b) => {
            const fc = a.filePath.localeCompare(b.filePath);
            return fc !== 0 ? fc : a.symbolName.localeCompare(b.symbolName);
        });
    }
}

function makeEntry(
    symbolName: string,
    kind: SymbolKind,
    filePath: string,
    startRow: number,
    endRow: number,
    docstring: string | null | undefined,
): IndexEntry {
    return {
        symbolName,
        kind,
        filePath,
        // tree-sitter rows are 0-based; convert to 1-based line numbers
        startLine: startRow + 1,
        endLine: endRow + 1,
        docstring: docstring ?? null,
    };
}
