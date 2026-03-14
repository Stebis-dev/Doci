import { ScanDepth } from 'commands/scan/scan.constants';
import { ExtractionOrchestrator } from 'controllers/ExtractionOrchestrator';
import { ExtractorType } from 'controllers/extract.types';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

/** Absolute path to the pre-written fixture files. */
const FIXTURES = path.resolve(import.meta.dirname, 'fixtures');
const ANIMAL_TS = path.join(FIXTURES, 'Animal.ts');
const DOG_TS = path.join(FIXTURES, 'Dog.ts');

// Temp directory for on-the-fly fixture files (size guard test)
let tmpDir: string;

afterAll(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    ExtractionOrchestrator.reset();
});

describe('ExtractionOrchestrator', () => {
    describe('guards', () => {
        it('returns status=skipped for an unsupported language', async () => {
            const result = await ExtractionOrchestrator.extractFromFile(
                '/fake/file.cs',
                'C#',
                ScanDepth.SYMBOLS,
            );

            expect(result.status).toBe('skipped');
            expect(result.symbols).toBeNull();
            expect(result.error).toMatch(/no parser available/i);
        });

        it('returns status=skipped when the file exceeds 1 MB', async () => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doci-orch-'));
            const bigFile = path.join(tmpDir, 'huge.ts');
            // Write 1.1 MB of whitespace
            fs.writeFileSync(bigFile, ' '.repeat(1.1 * 1024 * 1024));

            const result = await ExtractionOrchestrator.extractFromFile(
                bigFile,
                'TypeScript',
                ScanDepth.SYMBOLS,
            );

            expect(result.status).toBe('skipped');
            expect(result.error).toMatch(/size limit/i);
        });
    });

    describe('extraction — Animal.ts (depth: symbols)', () => {
        it('returns status=processed', async () => {
            const result = await ExtractionOrchestrator.extractFromFile(
                ANIMAL_TS,
                'TypeScript',
                ScanDepth.SYMBOLS,
            );

            expect(result.status).toBe('processed');
            expect(result.error).toBeNull();
        });

        it('extracts the Animal class', async () => {
            const result = await ExtractionOrchestrator.extractFromFile(
                ANIMAL_TS,
                'TypeScript',
                ScanDepth.SYMBOLS,
            );

            const classes = result.symbols?.[ExtractorType.Class] ?? [];
            const names = classes.map((c: any) => c.name);
            expect(names).toContain('Animal');
        });

        it('extracts the AnimalKind enum', async () => {
            const result = await ExtractionOrchestrator.extractFromFile(
                ANIMAL_TS,
                'TypeScript',
                ScanDepth.SYMBOLS,
            );

            const enums = result.symbols?.[ExtractorType.Enum] ?? [];
            const names = enums.map((e: any) => e.name);
            expect(names).toContain('AnimalKind');
        });

        it('does not include method bodies at depth=symbols', async () => {
            const result = await ExtractionOrchestrator.extractFromFile(
                ANIMAL_TS,
                'TypeScript',
                ScanDepth.SYMBOLS,
            );

            const methods = result.symbols?.[ExtractorType.Method] ?? [];
            for (const m of methods as any[]) {
                expect(m.body).toBeFalsy();
            }
        });
    });

    describe('extraction — Dog.ts (depth: full)', () => {
        it('captures the extends clause as raw inheritance', async () => {
            const result = await ExtractionOrchestrator.extractFromFile(
                DOG_TS,
                'TypeScript',
                ScanDepth.FULL,
            );

            const classes = result.symbols?.[ExtractorType.Class] ?? [];
            const dog = (classes as any[]).find(c => c.name === 'Dog');
            expect(dog).toBeDefined();
            expect(dog.inheritance).toContain('Animal');
        });

        it('includes method bodies at depth=full', async () => {
            const result = await ExtractionOrchestrator.extractFromFile(
                DOG_TS,
                'TypeScript',
                ScanDepth.FULL,
            );

            const methods = result.symbols?.[ExtractorType.Method] ?? [];
            const speak = (methods as any[]).find(m => m.name === 'speak');
            expect(speak).toBeDefined();
            expect(speak.body).toContain('barks');
        });
    });
});
