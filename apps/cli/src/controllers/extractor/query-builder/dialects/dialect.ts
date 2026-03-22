import type { LanguageDialect } from './dialect.types';
import { TypeScriptDialect } from './typescript.dialect';

export type { LanguageDialect, LanguageDialectNodes } from './dialect.types';
export { TypeScriptDialect } from './typescript.dialect';

/** Normalize a language display name to a lookup key (mirrors parser.types.ts). */
function normalizeLanguage(language: string): string {
    return language.toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * All registered dialects keyed by normalized language name.
 * JavaScript / JSX / TSX all share the TypeScript grammar, so they point to
 * the same dialect object.
 */
const dialectRegistry = new Map<string, LanguageDialect>([
    ['typescript', TypeScriptDialect],
    ['typescriptx', TypeScriptDialect],
    ['javascript', TypeScriptDialect],
    ['javascriptx', TypeScriptDialect],
]);

/**
 * Retrieve the dialect for a given language display name (e.g. `"TypeScript"`).
 * Throws if the language is not registered — callers should have already
 * guarded with `isLanguageSupported()`.
 */
export function getDialect(language: string): LanguageDialect {
    const key = normalizeLanguage(language);
    const dialect = dialectRegistry.get(key);
    if (!dialect) {
        throw new Error(`No dialect registered for language: "${language}"`);
    }
    return dialect;
}
