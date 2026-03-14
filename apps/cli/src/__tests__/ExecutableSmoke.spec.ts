/**
 * Smoke tests for the compiled binary.
 *
 * Detects the current OS and resolves the correct platform binary:
 *   Windows → release/win/doci-cli-win.exe
 *   macOS   → release/mac/doci-cli-macos
 *   Linux   → release/linux/doci-cli-linux
 *
 * All tests are skipped automatically when the binary is not present so that
 * the suite stays green before the first build on any platform.
 *
 * Run locally after building:
 *   pnpm run build:win | build:mac | build:linux
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ── paths ─────────────────────────────────────────────────────────────────────

const CLI_ROOT = path.resolve(import.meta.dirname, '..', '..');
const FIXTURES = path.resolve(import.meta.dirname, 'fixtures');

/** Resolve binary path from current OS. */
function resolveExePath(): string {
    switch (process.platform) {
        case 'win32': return path.join(CLI_ROOT, 'release', 'win', 'doci-cli-win.exe');
        case 'darwin': return path.join(CLI_ROOT, 'release', 'mac', 'doci-cli-macos');
        default: return path.join(CLI_ROOT, 'release', 'linux', 'doci-cli-linux');
    }
}

const EXE_PATH = resolveExePath();
const exeExists = fs.existsSync(EXE_PATH);

// ── helper ────────────────────────────────────────────────────────────────────

interface RunResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}

function runExe(args: string[], cwd = CLI_ROOT): RunResult {
    const result = spawnSync(EXE_PATH, args, {
        cwd,
        encoding: 'utf8',
        timeout: 30_000,
    });
    return {
        exitCode: result.status ?? -1,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
    };
}

// ── temp dir ──────────────────────────────────────────────────────────────────

let outDir: string;

beforeAll(() => {
    if (exeExists) {
        outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doci-smoke-'));
    }
});

afterAll(() => {
    if (outDir) fs.rmSync(outDir, { recursive: true, force: true });
});

// ── suites ────────────────────────────────────────────────────────────────────

describe.skipIf(!exeExists)('executable smoke — basic invocation', () => {
    it('--version exits 0 and prints a semver string', () => {
        const { exitCode, stdout } = runExe(['--version']);
        expect(exitCode).toBe(0);
        expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('--help exits 0 and contains the tool description', () => {
        const { exitCode, stdout } = runExe(['--help']);
        expect(exitCode).toBe(0);
        expect(stdout).toContain('doci-cli-tool');
    });

    it('scan --help exits 0', () => {
        const { exitCode, stdout } = runExe(['scan', '--help']);
        expect(exitCode).toBe(0);
        expect(stdout).toContain('scan');
    });
});

describe.skipIf(!exeExists)('executable smoke — scan command', () => {
    it('exits 0 when scanning the fixture directory', () => {
        const outFile = path.join(outDir, 'smoke-basic.json');
        const { exitCode } = runExe(['scan', '-d', FIXTURES, '--output', outFile]);
        expect(exitCode).toBe(0);
    });

    it('exits 1 when the target directory does not exist', () => {
        const { exitCode } = runExe(['scan', '-d', '/no/such/path/xyz']);
        expect(exitCode).toBe(1);
    });

    it('--stdout emits valid JSON with correct schemaVersion', () => {
        const { exitCode, stdout } = runExe(['scan', '-d', FIXTURES, '--stdout', '--depth', 'file']);
        expect(exitCode).toBe(0);

        const metadata = JSON.parse(stdout) as Metadata;
        expect(metadata.schemaVersion).toBe('1.0');
        expect(metadata.files.length).toBeGreaterThanOrEqual(2);
    });

    it('--stdout with --depth symbols populates class symbols for Animal.ts', () => {
        const { exitCode, stdout } = runExe([
            'scan', '-d', FIXTURES, '--stdout', '--depth', 'symbols',
        ]);
        expect(exitCode).toBe(0);

        const metadata = JSON.parse(stdout) as Metadata;
        const animal = metadata.files.find(f => f.fileName === 'Animal.ts');

        expect(animal).toBeDefined();
        const classNames = (animal!.symbols as any)?.classes?.map((c: any) => c.name) ?? [];
        expect(classNames).toContain('Animal');
    });

    it('--output writes a valid metadata file to disk', () => {
        const outFile = path.join(outDir, 'smoke-output.json');
        const { exitCode } = runExe([
            'scan', '-d', FIXTURES, '--output', outFile, '--depth', 'symbols',
        ]);

        expect(exitCode).toBe(0);
        expect(fs.existsSync(outFile)).toBe(true);

        const content = JSON.parse(fs.readFileSync(outFile, 'utf8')) as Metadata;
        expect(content.schemaVersion).toBe('1.0');
        expect(content.projects.length).toBeGreaterThan(0);
        expect(content.projects[0]).toHaveProperty('id');
    });

    it('--emit-index creates index.json beside the output file', () => {
        const outFile = path.join(outDir, 'smoke-index.json');
        const indexFile = path.join(outDir, 'index.json');

        const { exitCode } = runExe([
            'scan', '-d', FIXTURES,
            '--output', outFile,
            '--depth', 'symbols',
            '--emit-index',
        ]);

        expect(exitCode).toBe(0);
        expect(fs.existsSync(indexFile)).toBe(true);

        const entries = JSON.parse(fs.readFileSync(indexFile, 'utf8')) as IndexEntry[];
        expect(entries.length).toBeGreaterThan(0);
        expect(entries[0]).toHaveProperty('symbolName');
        expect(entries[0]).toHaveProperty('kind');
        expect(entries[0]).toHaveProperty('filePath');
        expect(entries[0]).toHaveProperty('startLine');
    });
});
