import { IndexBuilder } from 'controllers/IndexBuilder';
import { ExtractorType } from 'controllers/extract.types';
import { describe, expect, it } from 'vitest';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeClassSymbol(name: string, startRow: number, endRow: number, comment?: string) {
    return {
        uuid: 'u1',
        name,
        modifiers: [],
        inheritance: [],
        methods: [],
        properties: [],
        constructors: [],
        body: '',
        startPosition: { row: startRow, column: 0 },
        endPosition: { row: endRow, column: 1 },
        comment,
    };
}

function makeMethodSymbol(name: string, startRow: number, endRow: number) {
    return {
        uuid: 'u2',
        name,
        modifiers: [],
        genericName: '',
        predefinedType: [],
        objectType: [],
        parameters: [],
        body: '',
        startPosition: { row: startRow, column: 0 },
        endPosition: { row: endRow, column: 1 },
    };
}

function makeFile(filePath: string, symbols: Record<string, any[]>): FileMetadata {
    return {
        id: 'id',
        filePath,
        fileName: filePath.split('/').pop()!,
        extension: 'ts',
        mimeType: 'text/typescript',
        language: 'TypeScript',
        sizeBytes: 100,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        status: 'processed',
        error: null,
        symbols: { filePath, ...symbols },
    } as unknown as FileMetadata;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('IndexBuilder', () => {
    describe('buildIndex()', () => {
        it('produces one entry per symbol', () => {
            const file = makeFile('/project/a.ts', {
                [ExtractorType.Class]: [makeClassSymbol('Animal', 0, 10)],
                [ExtractorType.Method]: [makeMethodSymbol('speak', 5, 7)],
            });

            const entries = IndexBuilder.buildIndex([file]);

            expect(entries).toHaveLength(2);
        });

        it('converts 0-based tree-sitter rows to 1-based line numbers', () => {
            const file = makeFile('/project/a.ts', {
                [ExtractorType.Class]: [makeClassSymbol('Animal', 4, 20)],
            });

            const entries = IndexBuilder.buildIndex([file]);

            expect(entries[0].startLine).toBe(5);
            expect(entries[0].endLine).toBe(21);
        });

        it('carries docstring from the comment field', () => {
            const file = makeFile('/project/a.ts', {
                [ExtractorType.Class]: [makeClassSymbol('Animal', 0, 5, 'A base class')],
            });

            const entries = IndexBuilder.buildIndex([file]);

            expect(entries[0].docstring).toBe('A base class');
        });

        it('sets docstring to null when no comment is present', () => {
            const file = makeFile('/project/a.ts', {
                [ExtractorType.Class]: [makeClassSymbol('Animal', 0, 5)],
            });

            const entries = IndexBuilder.buildIndex([file]);

            expect(entries[0].docstring).toBeNull();
        });

        it('sorts output by filePath then symbolName', () => {
            const fileB = makeFile('/project/b.ts', {
                [ExtractorType.Class]: [makeClassSymbol('Zebra', 0, 5)],
            });
            const fileA = makeFile('/project/a.ts', {
                [ExtractorType.Class]: [makeClassSymbol('Animal', 0, 5)],
            });

            const entries = IndexBuilder.buildIndex([fileB, fileA]);

            expect(entries[0].filePath).toBe('/project/a.ts');
            expect(entries[0].symbolName).toBe('Animal');
            expect(entries[1].filePath).toBe('/project/b.ts');
            expect(entries[1].symbolName).toBe('Zebra');
        });

        it('skips files that have no symbols', () => {
            const file: FileMetadata = {
                id: 'id', filePath: '/a.ts', fileName: 'a.ts', extension: 'ts',
                mimeType: 'text/typescript', language: 'TypeScript', sizeBytes: 10,
                createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString(),
                status: 'skipped', error: null,
            };

            const entries = IndexBuilder.buildIndex([file]);

            expect(entries).toHaveLength(0);
        });

        it('correctly assigns the "kind" field for each symbol type', () => {
            const file = makeFile('/project/a.ts', {
                [ExtractorType.Class]: [makeClassSymbol('MyClass', 0, 10)],
                [ExtractorType.Method]: [makeMethodSymbol('myMethod', 2, 5)],
            });

            const entries = IndexBuilder.buildIndex([file]);
            const kinds = entries.map(e => e.kind).sort();

            expect(kinds).toEqual(['class', 'method'].sort());
        });
    });
});
