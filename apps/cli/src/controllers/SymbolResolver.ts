import { ClassTemporaryDetail, ExtractedDetails, ExtractorType, ResolvedRef } from "controllers/extract.types";

/**
 * A map from declared symbol name → the file that declares it.
 * Built once from all extracted files and then used to resolve
 * inheritance references cross-file.
 *
 * When two files export the same name (e.g. aliased re-exports), the first
 * occurrence wins — deterministic because extraction order mirrors the sorted
 * traversal order.
 */
export type SymbolRegistry = Map<string, string>;

/**
 * Performs a cross-file symbol resolution pass after all files have been
 * extracted.
 *
 * Responsibilities:
 *  1. Build a `SymbolRegistry` (name → filePath) from every extracted symbol
 *     across all files.
 *  2. Walk every extracted class and populate `resolvedInheritance` by looking
 *     up each raw name from `inheritance[]` in the registry.
 *
 * This is a pure post-processing step — it **mutates** the `symbols` objects
 * stored in `FileMetadata` in-place and does not re-parse any source files.
 */
export class SymbolResolver {
    /**
     * Build a name→filePath registry from the symbols already stored in
     * `FileMetadata.symbols`.
     *
     * All symbol kinds (class, method, constructor, property, enum) are
     * indexed so that inheritance lookups work even when a base class has no
     * separate class declaration in a file (e.g. is only declared as a function).
     */
    static buildRegistry(files: FileMetadata[]): SymbolRegistry {
        const registry: SymbolRegistry = new Map();

        for (const file of files) {
            if (!file.symbols) continue;
            const symbols = file.symbols as ExtractedDetails;
            const fp = file.filePath;

            const allNames: string[] = [
                ...(symbols[ExtractorType.Class]?.map(c => c.name) ?? []),
                ...(symbols[ExtractorType.Method]?.map(m => m.name) ?? []),
                ...(symbols[ExtractorType.Constructor]?.map(c => c.name) ?? []),
                ...(symbols[ExtractorType.Property]?.map(p => p.name) ?? []),
                ...(symbols[ExtractorType.Enum]?.map(e => e.name) ?? []),
            ];

            for (const name of allNames) {
                if (name && !registry.has(name)) {
                    registry.set(name, fp);
                }
            }
        }

        return registry;
    }

    /**
     * Resolve `inheritance[]` references for every class in every file.
     * Mutates `ClassTemporaryDetail.resolvedInheritance` in place.
     *
     * @returns The number of inheritance references that were successfully resolved.
     */
    static resolveInheritance(files: FileMetadata[], registry: SymbolRegistry): number {
        let resolved = 0;

        for (const file of files) {
            if (!file.symbols) continue;
            const symbols = file.symbols as ExtractedDetails;
            const classes = symbols[ExtractorType.Class] as ClassTemporaryDetail[] | undefined;
            if (!classes?.length) continue;

            for (const cls of classes) {
                if (!cls.inheritance?.length) {
                    cls.resolvedInheritance = [];
                    continue;
                }

                cls.resolvedInheritance = cls.inheritance.map((name): ResolvedRef => ({
                    name,
                    filePath: registry.get(name) ?? null,
                }));

                resolved += cls.resolvedInheritance.filter(r => r.filePath !== null).length;
            }
        }

        return resolved;
    }

    /**
     * Convenience method: build the registry and resolve inheritance in one call.
     *
     * @returns An object with `{ registry, resolved }` for logging.
     */
    static run(files: FileMetadata[]): { registry: SymbolRegistry; resolved: number } {
        const registry = SymbolResolver.buildRegistry(files);
        const resolved = SymbolResolver.resolveInheritance(files, registry);
        return { registry, resolved };
    }
}
