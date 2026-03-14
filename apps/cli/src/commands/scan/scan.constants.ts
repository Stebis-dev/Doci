export const SCAN_COMMAND_NAME = 'scan';
export const SCAN_COMMAND_DESCRIPTION = 'Scan a directory for files';

export const SCHEMA_VERSION = '1.0';

/** Controls how much detail is emitted per file */
export enum ScanDepth {
    /** File-level metadata only (path, size, timestamps, language) */
    FILE = 'file',
    /** File metadata + symbol names and positions (no bodies) */
    SYMBOLS = 'symbols',
    /** Full extraction including method bodies, comments, cross-references */
    FULL = 'full',
}

export const DEFAULT_IGNORED_FOLDERS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'out',
];
export const DEFAULT_IGNORED_FILES = [
    '.DS_Store',
];