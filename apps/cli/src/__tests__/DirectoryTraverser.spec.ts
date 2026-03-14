import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DirectoryTraverser } from 'commands/scan/DirectoryTraverser';

let tmpDir: string;

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doci-traverser-'));
    DirectoryTraverser.reset();
    // Populate default ignore patterns (node_modules, .git, dist, etc.)
    DirectoryTraverser.generateIgnorePatterns();
});

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('DirectoryTraverser', () => {
    describe('traverseDirectory', () => {
        it('discovers all files in a flat directory', () => {
            fs.writeFileSync(path.join(tmpDir, 'a.ts'), '');
            fs.writeFileSync(path.join(tmpDir, 'b.ts'), '');

            DirectoryTraverser.traverseDirectory(tmpDir, tmpDir);

            expect(DirectoryTraverser.files).toHaveLength(2);
        });

        it('recurses into subdirectories', () => {
            const sub = path.join(tmpDir, 'sub');
            fs.mkdirSync(sub);
            fs.writeFileSync(path.join(tmpDir, 'root.ts'), '');
            fs.writeFileSync(path.join(sub, 'nested.ts'), '');

            DirectoryTraverser.traverseDirectory(tmpDir, tmpDir);

            expect(DirectoryTraverser.files).toHaveLength(2);
        });

        it('excludes node_modules by default', () => {
            const nm = path.join(tmpDir, 'node_modules');
            fs.mkdirSync(nm);
            fs.writeFileSync(path.join(nm, 'pkg.js'), '');
            fs.writeFileSync(path.join(tmpDir, 'main.ts'), '');

            DirectoryTraverser.traverseDirectory(tmpDir, tmpDir);

            expect(DirectoryTraverser.files).toHaveLength(1);
            expect(DirectoryTraverser.files[0]).toContain('main.ts');
        });

        it('excludes .git by default', () => {
            const git = path.join(tmpDir, '.git');
            fs.mkdirSync(git);
            fs.writeFileSync(path.join(git, 'config'), '');
            fs.writeFileSync(path.join(tmpDir, 'src.ts'), '');

            DirectoryTraverser.traverseDirectory(tmpDir, tmpDir);

            expect(DirectoryTraverser.files).toHaveLength(1);
        });

        it('--include glob keeps only matching files', () => {
            fs.writeFileSync(path.join(tmpDir, 'a.ts'), '');
            fs.writeFileSync(path.join(tmpDir, 'b.js'), '');
            fs.writeFileSync(path.join(tmpDir, 'c.md'), '');

            DirectoryTraverser.traverseDirectory(tmpDir, tmpDir, { include: ['*.ts'] });

            expect(DirectoryTraverser.files).toHaveLength(1);
            expect(path.basename(DirectoryTraverser.files[0])).toBe('a.ts');
        });

        it('--exclude glob skips matching files', () => {
            fs.writeFileSync(path.join(tmpDir, 'a.ts'), '');
            fs.writeFileSync(path.join(tmpDir, 'a.spec.ts'), '');

            DirectoryTraverser.traverseDirectory(tmpDir, tmpDir, { exclude: ['*.spec.ts'] });

            expect(DirectoryTraverser.files).toHaveLength(1);
            expect(path.basename(DirectoryTraverser.files[0])).toBe('a.ts');
        });

        it('returns results in lexicographic order', () => {
            // Create in reverse order — traversal should still sort them
            fs.writeFileSync(path.join(tmpDir, 'z.ts'), '');
            fs.writeFileSync(path.join(tmpDir, 'a.ts'), '');
            fs.writeFileSync(path.join(tmpDir, 'm.ts'), '');

            DirectoryTraverser.traverseDirectory(tmpDir, tmpDir);

            const names = DirectoryTraverser.files.map(f => path.basename(f));
            expect(names).toEqual([...names].sort());
        });
    });

    describe('reset()', () => {
        it('clears discovered files', () => {
            fs.writeFileSync(path.join(tmpDir, 'a.ts'), '');
            DirectoryTraverser.traverseDirectory(tmpDir, tmpDir);
            expect(DirectoryTraverser.files).toHaveLength(1);

            DirectoryTraverser.reset();

            expect(DirectoryTraverser.files).toHaveLength(0);
        });

        it('clears gitignore file list', () => {
            DirectoryTraverser.findGitignoreFiles(tmpDir);
            DirectoryTraverser.reset();

            expect(DirectoryTraverser.gitignoreFiles).toHaveLength(0);
        });
    });
});
