import { Language } from "web-tree-sitter";
import { createRequire } from "module";
import { existsSync } from "fs";

/**
 * Maps a normalised language key to the npm package name and the WASM file
 * it ships.  Both keys are lowercase so callers must normalise before lookup.
 */
export const LanguageWasmMap: Record<string, { package: string; wasm: string }> = {
    javascript: { package: 'tree-sitter-javascript', wasm: 'tree-sitter-javascript.wasm' },
    javascriptx: { package: 'tree-sitter-javascript', wasm: 'tree-sitter-javascript.wasm' },
    typescript: { package: 'tree-sitter-typescript', wasm: 'tree-sitter-typescript.wasm' },
    typescriptx: { package: 'tree-sitter-typescript', wasm: 'tree-sitter-tsx.wasm' },
};

/** @deprecated Use LanguageWasmMap */
export const LanguageLibraries: { [key: string]: string } = {
    javascript: 'tree-sitter-javascript',
    typescript: 'tree-sitter-typescript',
};

/** Normalise a language display name (e.g. "TypeScript") to a lookup key. */
function normalise(language: string): string {
    return language.toLowerCase().replace(/[^a-z]/g, '');
}

export function isLanguageSupported(language: string): boolean {
    return normalise(language) in LanguageWasmMap;
}

export async function getLanguage(language: string): Promise<Language> {
    const key = normalise(language);
    const entry = LanguageWasmMap[key];

    if (!entry) {
        throw new Error(`Language "${language}" is not supported.`);
    }

    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve(`${entry.package}/${entry.wasm}`);

    if (!existsSync(wasmPath)) {
        throw new Error(`WASM file for language "${language}" not found at: ${wasmPath}`);
    }

    return Language.load(wasmPath);
}
