import { Language } from "web-tree-sitter";
import JavaScript from "tree-sitter-javascript";
import TypeScript from "tree-sitter-typescript";

export function getLanguage(language: string): Language {
    const lang = language.toLowerCase();
    console.log(LanguageLibraries[lang]);
    return LanguageLibraries[lang];
}

export function isLanguageSupported(language: string): boolean {
    const lang = language.toLowerCase();
    return lang in LanguageLibraries;
}

export const LanguageLibraries: { [key: string]: Language } = {
    javascript: JavaScript.language as Language,
    typescript: TypeScript.typescript.language as Language,
};