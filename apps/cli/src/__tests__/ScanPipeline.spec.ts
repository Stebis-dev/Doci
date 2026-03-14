/**
 * Pipeline integration tests for the `scan` command.
 *
 * Each test spawns the CLI as a real child process so the full sequence:
 *   DirectoryTraverser → ExtractionOrchestrator → SymbolResolver →
 *   PopulateMetadata → MetadataFile / IndexFile
 * is exercised without mocking, and exit-code / stdout / file-system
 * side-effects can all be asserted.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/** Root of the CLI package (where package.json lives). */
const CLI_ROOT = path.resolve(import.meta.dirname, '..', '..');

/**
 * Resolve the tsx binary from the local node_modules/.bin directory.
 * `shell: true` (used in runScan) makes Windows automatically resolve
 * tsx → tsx.cmd without needing to branch on platform here.
 */
const TSX = path.join(CLI_ROOT, 'node_modules', '.bin', 'tsx');

/** The two known fixture files written by the Phase-6 test setup. */
const FIXTURES = path.resolve(import.meta.dirname, 'fixtures');

/** Temp directory used for --output tests (created once, cleaned up after). */
let outDir: string;

beforeAll(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doci-pipeline-'));
});

afterAll(() => {
    if (outDir) fs.rmSync(outDir, { recursive: true, force: true });
});

// ── helper ────────────────────────────────────────────────────────────────────

interface RunResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}

function runScan(args: string[]): RunResult {
    const result = spawnSync(TSX, ['src/index.ts', 'scan', ...args], {
        cwd: CLI_ROOT,
        encoding: 'utf8',
        shell: true,      // lets Windows resolve tsx.cmd automatically
        timeout: 25_000,
    });
    return {
        exitCode: result.status ?? -1,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
    };
}

// ── exit-code tests ───────────────────────────────────────────────────────────

describe('scan pipeline — exit codes', () => {
    it('exits 0 on a successful scan (depth=file)', () => {
        const { exitCode } = runScan(['-d', FIXTURES]);
        expect(exitCode).toBe(0);
    });

    it('exits 1 when the target directory does not exist', () => {
        const { exitCode } = runScan(['-d', '/definitely/does/not/exist/xyz']);
        expect(exitCode).toBe(1);
    });
});

// ── --stdout mode ─────────────────────────────────────────────────────────────

describe('scan pipeline — --stdout', () => {
    it('writes valid JSON to stdout (depth=file)', () => {
        const { exitCode, stdout } = runScan(['-d', FIXTURES, '--stdout']);
        expect(exitCode).toBe(0);

        const metadata = JSON.parse(stdout) as Metadata;
        expect(metadata.schemaVersion).toBe('1.0');
        expect(metadata.files.length).toBeGreaterThanOrEqual(2); // Animal.ts + Dog.ts
    });

    it('counts.scanned equals the number of discovered files', () => {
        const { stdout } = runScan(['-d', FIXTURES, '--stdout']);
        const metadata = JSON.parse(stdout) as Metadata;
        expect(metadata.counts.scanned).toBe(metadata.files.length);
    });

    it('counts.processed equals scanned for a TS-only directory (depth=file)', () => {
        const { stdout } = runScan(['-d', FIXTURES, '--stdout', '--include', '*.ts']);
        const metadata = JSON.parse(stdout) as Metadata;
        expect(metadata.counts.processed).toBe(metadata.counts.scanned);
        expect(metadata.counts.failed).toBe(0);
    });
});

// ── depth modes ───────────────────────────────────────────────────────────────

describe('scan pipeline — depth modes', () => {
    it('depth=file does not populate symbols on file entries', () => {
        const { stdout } = runScan(['-d', FIXTURES, '--stdout', '--depth', 'file']);
        const metadata = JSON.parse(stdout) as Metadata;
        for (const f of metadata.files) {
            // At depth=file, symbols is either absent or null — never a populated object
            expect(f.symbols ?? null).toBeNull();
        }
    });

    it('depth=symbols populates symbols on TypeScript files', () => {
        const { stdout } = runScan(['-d', FIXTURES, '--stdout', '--depth', 'symbols']);
        const metadata = JSON.parse(stdout) as Metadata;

        const tsFiles = metadata.files.filter(f =>
            f.extension === 'ts' && f.status === 'processed',
        );
        expect(tsFiles.length).toBeGreaterThan(0);

        for (const f of tsFiles) {
            expect(f.symbols).toBeDefined();
        }
    });

    it('depth=symbols — Animal.ts contains the Animal class and AnimalKind enum', () => {
        const { stdout } = runScan(['-d', FIXTURES, '--stdout', '--depth', 'symbols']);
        const metadata = JSON.parse(stdout) as Metadata;

        const animal = metadata.files.find(f => f.fileName === 'Animal.ts');
        expect(animal).toBeDefined();
        expect(animal!.symbols).toBeDefined();

        const classNames = (animal!.symbols as any).classes?.map((c: any) => c.name) ?? [];
        const enumNames = (animal!.symbols as any).enums?.map((e: any) => e.name) ?? [];

        expect(classNames).toContain('Animal');
        expect(enumNames).toContain('AnimalKind');
    });

    it('depth=symbols — Dog.ts has inheritance pointing to Animal', () => {
        const { stdout } = runScan(['-d', FIXTURES, '--stdout', '--depth', 'symbols']);
        const metadata = JSON.parse(stdout) as Metadata;

        const dog = metadata.files.find(f => f.fileName === 'Dog.ts');
        const dogClass = (dog!.symbols as any).classes?.find((c: any) => c.name === 'Dog');

        expect(dogClass).toBeDefined();
        expect(dogClass.inheritance).toContain('Animal');
    });

    it('depth=symbols resolves Dog → Animal cross-file via resolvedInheritance', () => {
        const { stdout } = runScan(['-d', FIXTURES, '--stdout', '--depth', 'symbols']);
        const metadata = JSON.parse(stdout) as Metadata;

        const dog = metadata.files.find(f => f.fileName === 'Dog.ts');
        const dogClass = (dog!.symbols as any).classes?.find((c: any) => c.name === 'Dog');

        const resolved = dogClass?.resolvedInheritance ?? [];
        const animalRef = resolved.find((r: any) => r.name === 'Animal');

        expect(animalRef).toBeDefined();
        expect(animalRef.filePath).toContain('Animal.ts');
    });

    it('depth=symbols strips method bodies', () => {
        const { stdout } = runScan(['-d', FIXTURES, '--stdout', '--depth', 'symbols']);
        const metadata = JSON.parse(stdout) as Metadata;

        for (const f of metadata.files) {
            const methods: any[] = (f.symbols as any)?.methods ?? [];
            for (const m of methods) {
                expect(m.body ?? '').toBeFalsy();
            }
        }
    });

    it('depth=full includes method bodies', () => {
        const { stdout } = runScan(['-d', FIXTURES, '--stdout', '--depth', 'full']);
        const metadata = JSON.parse(stdout) as Metadata;

        const dog = metadata.files.find(f => f.fileName === 'Dog.ts');
        const speak = (dog!.symbols as any)?.methods?.find((m: any) => m.name === 'speak');

        expect(speak).toBeDefined();
        expect(speak.body).toContain('barks');
    });
});

// ── --include / --exclude ─────────────────────────────────────────────────────

describe('scan pipeline — include / exclude filters', () => {
    it('--include *.ts restricts discovered files to .ts', () => {
        const { stdout } = runScan(['-d', FIXTURES, '--stdout', '--include', '*.ts']);
        const metadata = JSON.parse(stdout) as Metadata;

        for (const f of metadata.files) {
            expect(f.extension).toBe('ts');
        }
    });

    it('--exclude Dog.ts drops that file from results', () => {
        const { stdout } = runScan(['-d', FIXTURES, '--stdout', '--exclude', 'Dog.ts']);
        const metadata = JSON.parse(stdout) as Metadata;

        const names = metadata.files.map(f => f.fileName);
        expect(names).not.toContain('Dog.ts');
    });
});

// ── --output + --emit-index ───────────────────────────────────────────────────

describe('scan pipeline — file output', () => {
    it('--output writes metadata to the specified path', () => {
        const outFile = path.join(outDir, 'meta-output.json');
        const { exitCode } = runScan(['-d', FIXTURES, '--output', outFile]);

        expect(exitCode).toBe(0);
        expect(fs.existsSync(outFile)).toBe(true);

        const content = JSON.parse(fs.readFileSync(outFile, 'utf8')) as Metadata;
        expect(content.schemaVersion).toBe('1.0');
        expect(content.files.length).toBeGreaterThan(0);
    });

    it('--emit-index creates an index.json beside metadata.json', () => {
        const outFile = path.join(outDir, 'meta-index.json');
        const indexFile = path.join(outDir, 'index.json');

        const { exitCode } = runScan([
            '-d', FIXTURES,
            '--output', outFile,
            '--depth', 'symbols',
            '--emit-index',
        ]);

        expect(exitCode).toBe(0);
        expect(fs.existsSync(indexFile)).toBe(true);

        const entries = JSON.parse(fs.readFileSync(indexFile, 'utf8')) as IndexEntry[];
        expect(entries.length).toBeGreaterThan(0);
    });

    it('--emit-index entries have valid shape', () => {
        const outFile = path.join(outDir, 'meta-shape.json');
        const indexFile = path.join(outDir, 'index.json');

        runScan([
            '-d', FIXTURES,
            '--output', outFile,
            '--depth', 'symbols',
            '--emit-index',
        ]);

        const entries = JSON.parse(fs.readFileSync(indexFile, 'utf8')) as IndexEntry[];
        for (const e of entries) {
            expect(e).toHaveProperty('symbolName');
            expect(e).toHaveProperty('kind');
            expect(e).toHaveProperty('filePath');
            expect(e.startLine).toBeGreaterThan(0);
            expect(e.endLine).toBeGreaterThanOrEqual(e.startLine);
        }
    });

    it('--emit-index Animal.ts contributes a class entry', () => {
        const outFile = path.join(outDir, 'meta-animal.json');
        const indexFile = path.join(outDir, 'index.json');

        runScan([
            '-d', FIXTURES,
            '--output', outFile,
            '--depth', 'symbols',
            '--emit-index',
        ]);

        const entries = JSON.parse(fs.readFileSync(indexFile, 'utf8')) as IndexEntry[];
        const animalClass = entries.find(e => e.symbolName === 'Animal' && e.kind === 'class');
        expect(animalClass).toBeDefined();
        expect(animalClass!.filePath).toContain('Animal.ts');
    });
});
