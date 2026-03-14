import { describe, it, expect } from 'vitest';
import { SymbolResolver } from 'controllers/SymbolResolver';
import { ExtractorType } from 'controllers/extract.types';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeFile(
    filePath: string,
    classes: { name: string; inheritance: string[] }[],
): FileMetadata {
    return {
        id: 'test',
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
        symbols: {
            filePath,
            [ExtractorType.Class]: classes.map(c => ({
                uuid: 'uuid',
                name: c.name,
                modifiers: [],
                inheritance: c.inheritance,
                methods: [],
                properties: [],
                constructors: [],
                body: '',
                startPosition: { row: 0, column: 0 },
                endPosition: { row: 10, column: 0 },
            })),
        },
    } as unknown as FileMetadata;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('SymbolResolver', () => {
    describe('buildRegistry()', () => {
        it('maps class names to their file paths', () => {
            const file = makeFile('/project/Animal.ts', [{ name: 'Animal', inheritance: [] }]);

            const registry = SymbolResolver.buildRegistry([file]);

            expect(registry.get('Animal')).toBe('/project/Animal.ts');
        });

        it('first occurrence wins for duplicate symbol names', () => {
            const a = makeFile('/project/a.ts', [{ name: 'Shared', inheritance: [] }]);
            const b = makeFile('/project/b.ts', [{ name: 'Shared', inheritance: [] }]);

            const registry = SymbolResolver.buildRegistry([a, b]);

            expect(registry.get('Shared')).toBe('/project/a.ts');
        });

        it('indexes symbols from files without symbols as empty', () => {
            const empty: FileMetadata = {
                id: 'test', filePath: '/f.ts', fileName: 'f.ts', extension: 'ts',
                mimeType: 'text/typescript', language: 'TypeScript', sizeBytes: 0,
                createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString(),
                status: 'skipped', error: null,
            };

            const registry = SymbolResolver.buildRegistry([empty]);

            expect(registry.size).toBe(0);
        });
    });

    describe('resolveInheritance()', () => {
        it('resolves a parent class found in the scanned directory', () => {
            const parent = makeFile('/project/Animal.ts', [{ name: 'Animal', inheritance: [] }]);
            const child = makeFile('/project/Dog.ts', [{ name: 'Dog', inheritance: ['Animal'] }]);

            const { resolved } = SymbolResolver.run([parent, child]);
            const dogClass = (child.symbols as any)[ExtractorType.Class][0];

            expect(resolved).toBe(1);
            expect(dogClass.resolvedInheritance).toEqual([
                { name: 'Animal', filePath: '/project/Animal.ts' },
            ]);
        });

        it('sets filePath to null for symbols not found in the scan', () => {
            const file = makeFile('/project/err.ts', [{ name: 'CustomError', inheritance: ['Error'] }]);

            const { resolved } = SymbolResolver.run([file]);
            const cls = (file.symbols as any)[ExtractorType.Class][0];

            expect(resolved).toBe(0);
            expect(cls.resolvedInheritance[0]).toEqual({ name: 'Error', filePath: null });
        });

        it('produces an empty resolvedInheritance array for classes with no parents', () => {
            const file = makeFile('/project/Base.ts', [{ name: 'Base', inheritance: [] }]);

            SymbolResolver.run([file]);
            const cls = (file.symbols as any)[ExtractorType.Class][0];

            expect(cls.resolvedInheritance).toEqual([]);
        });

        it('handles multiple inheritance entries (implements clause)', () => {
            const iface = makeFile('/project/Runnable.ts', [{ name: 'Runnable', inheritance: [] }]);
            const parent = makeFile('/project/Animal.ts', [{ name: 'Animal', inheritance: [] }]);
            const child = makeFile('/project/Dog.ts', [
                { name: 'Dog', inheritance: ['Animal', 'Runnable'] },
            ]);

            const { resolved } = SymbolResolver.run([iface, parent, child]);
            const dogClass = (child.symbols as any)[ExtractorType.Class][0];

            expect(resolved).toBe(2);
            expect(dogClass.resolvedInheritance).toHaveLength(2);
            expect(dogClass.resolvedInheritance.map((r: any) => r.name)).toEqual([
                'Animal', 'Runnable',
            ]);
        });
    });
});
