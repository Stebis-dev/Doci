import { Injectable } from '@angular/core';
import { Parser, Language, Tree } from 'web-tree-sitter';
import { extensionToLanguage } from './parser.strategy';
import { ProgrammingLanguageExtension } from '@doci/shared';


@Injectable({
    providedIn: 'root'
})
export class TreeSitterService {
    protected parser: Parser | null = null;
    protected language: Language | null = null;
    private initialized = false;

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            // Initialize the parser
            await Parser.init({
                locateFile(scriptName: string) {
                    return `assets/tree-sitter/${scriptName}`;
                }
            });

            this.parser = new Parser();

            console.log('Tree-sitter ready');

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize Tree-sitter:', error);
            throw error;
        }
    }

    async setLanguage(extension: string): Promise<void> {
        if (!this.parser) {
            throw new Error('Parser not initialized');
        }
        const language = extensionToLanguage.get(extension as ProgrammingLanguageExtension);

        try {
            const grammarPath = `assets/tree-sitter-${language}.wasm`;
            console.log('Loading grammar from:', grammarPath);

            const loadedLanguage = await Language.load(grammarPath);
            if (loadedLanguage) {
                this.language = loadedLanguage;
                this.parser.setLanguage(this.language);
                console.log(`Language ${language} loaded successfully`);
            } else {
                throw new Error(`Failed to load language ${language}`);
            }
        } catch (error) {
            console.error(`Failed to load language ${language}:`, error);
            throw error;
        }
    }

    async parse(code: string): Promise<Tree | null> {
        if (!this.initialized) {
            await this.initialize();
        }

        if (!this.parser || !this.language) {
            throw new Error('Parser not initialized');
        }

        try {
            // Create a callback function that returns the code at the requested position
            // const callback = (input: string, index: number, row: number, column: number, length: number): string => {
            //     return code.substring(index, index + length);
            // };

            return this.parser.parse(code);
        } catch (error) {
            console.error('Failed to parse code:', error);
            throw error;
        }
    }

    // abstract getLanguage(): string;
} 