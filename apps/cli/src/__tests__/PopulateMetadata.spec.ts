import type { FileMetadata, FileStatus } from '@doci/types';
import { PopulateMetadata } from 'commands/scan/PopulateMetadata';
import { SCHEMA_VERSION } from 'commands/scan/scan.constants';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('PopulateMetadata', () => {
    describe('populateMetadata()', () => {
        it('sets schemaVersion from the constant', () => {
            const m = PopulateMetadata.populateMetadata([], []);
            expect(m.schemaVersion).toBe(SCHEMA_VERSION);
        });

        it('generates a valid UUID instanceId on each call', () => {
            const m1 = PopulateMetadata.populateMetadata([], []);
            const m2 = PopulateMetadata.populateMetadata([], []);
            expect(m1.instanceId).toMatch(UUID_RE);
            expect(m2.instanceId).toMatch(UUID_RE);
            expect(m1.instanceId).not.toBe(m2.instanceId);
        });

        it('generatedAt is a valid ISO-8601 string', () => {
            const m = PopulateMetadata.populateMetadata([], []);
            expect(new Date(m.generatedAt).toISOString()).toBe(m.generatedAt);
        });

        it('counts reflect the statuses of fileMetadata entries', () => {
            const fakeFiles: FileMetadata[] = [
                makeFileMeta('processed'),
                makeFileMeta('processed'),
                makeFileMeta('skipped'),
                makeFileMeta('failed'),
            ];

            const m = PopulateMetadata.populateMetadata([], fakeFiles);

            expect(m.counts.scanned).toBe(4);
            expect(m.counts.processed).toBe(2);
            expect(m.counts.skipped).toBe(1);
            expect(m.counts.failed).toBe(1);
        });
    });

    describe('populateFileMetadata()', () => {
        let tmpDir: string;

        afterEach(() => {
            if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
        });

        it('returns one entry per file path', () => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doci-meta-'));
            const f1 = path.join(tmpDir, 'a.ts');
            const f2 = path.join(tmpDir, 'b.ts');
            fs.writeFileSync(f1, '');
            fs.writeFileSync(f2, '');

            const result = PopulateMetadata.populateFileMetadata([f1, f2]);

            expect(result).toHaveLength(2);
        });

        it('overrides status/error/symbols from symbolsMap when provided', () => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doci-meta-'));
            const f = path.join(tmpDir, 'a.ts');
            fs.writeFileSync(f, '');

            const symbolsMap = new Map([
                [f, { symbols: null, status: 'skipped' as const, error: 'no parser' }],
            ]);
            const result = PopulateMetadata.populateFileMetadata([f], symbolsMap);

            expect(result[0].status).toBe('skipped');
            expect(result[0].error).toBe('no parser');
        });
    });
});

// ── helpers ──────────────────────────────────────────────────────────────────

function makeFileMeta(status: FileStatus): FileMetadata {
    return {
        id: 'test',
        filePath: '/fake/file.ts',
        fileName: 'file.ts',
        extension: 'ts',
        mimeType: 'text/typescript',
        language: 'TypeScript',
        sizeBytes: 0,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        status,
        error: null,
    };
}
