import { Language } from "web-tree-sitter";
import { createRequire } from "module";
import { existsSync } from "fs";

export async function getLanguage(language: string): Promise<Language> {

    const languageName = language.toLowerCase();

    const languageWasmName = LanguageLibraries[languageName]
    // TODO unified loader for loading wasmPath
    if (process.versions.bun) {
        console.log("Running from bundled .exe");
    } else {
        console.log("Running in local development");
    }
    // console.log(process);
    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve(`${languageWasmName}/${languageWasmName}.wasm`);
    console.log(`Loading WASM for language ${language} from path: ${wasmPath}`);
    // TODO for bundle fix so that it would use local wasm
    // Loading WASM for language TypeScript from path: D:\Doci\node_modules\.pnpm\tree-sitter-typescript@0.23.2\node_modules\tree-sitter-typescript\tree-sitter-typescript.wasm

    if (!existsSync(wasmPath)) {
        console.error(`WASM file for language ${language} not found at path: ${wasmPath}`);
        process.exit(1);
    }

    const loadedLanguage = await Language.load(wasmPath);
    return loadedLanguage;
}

export function isLanguageSupported(language: string): boolean {
    const lang = language.toLowerCase();
    return lang in LanguageLibraries;
}

export const LanguageLibraries: { [key: string]: string } = {
    javascript: "tree-sitter-javascript",
    typescript: "tree-sitter-typescript",
};
