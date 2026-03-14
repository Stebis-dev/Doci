/** Counts reported at the end of a scan run */
export interface ScanCounts {
    /** Total files discovered during traversal */
    scanned: number;
    /** Files successfully catalogued */
    processed: number;
    /** Files skipped (unsupported type, size limit, exclude rule) */
    skipped: number;
    /** Files where processing raised an error */
    failed: number;
}

export interface ProjectMetadata {
    /** UUID for the scanned directory entry */
    id: string;
    /** Directory / project name */
    name: string;
    /** Absolute root path of the scanned directory */
    rootPath: string;
    totalFiles: number;
    /** IDs of every FileMetadata entry belonging to this project */
    fileIds: string[];
    createdAt: string;
    modifiedAt: string;
}

export type FileStatus = 'processed' | 'skipped' | 'failed';

export interface FileMetadata {
    /** UUID */
    id: string;
    /** Absolute path to the file */
    filePath: string;
    /** The name of the file */
    fileName: string;
    /** The file extension without leading dot */
    extension: string;
    /** The MIME type of the file */
    mimeType: string;
    /** The programming language inferred from the file extension */
    language: string;
    /** File size in bytes */
    sizeBytes: number;
    /** ISO-8601 creation timestamp */
    createdAt: string;
    /** ISO-8601 last-modified timestamp */
    modifiedAt: string;
    /** Processing outcome for this file */
    status: FileStatus;
    /** Human-readable reason when status is skipped or failed */
    error: string | null;
}

export interface Metadata {
    /** UUID for this specific scan run */
    instanceId: string;
    /** Schema version – increment when the shape changes */
    schemaVersion: string;
    /** ISO-8601 timestamp of when the scan completed */
    generatedAt: string;
    projects: ProjectMetadata[];
    files: FileMetadata[];
    totalProjects: number;
    counts: ScanCounts;
}

/** Symbol kind values used in the flat index */
export type SymbolKind = 'class' | 'method' | 'constructor' | 'property' | 'enum';

/**
 * One row in the flat symbol index (index.json).
 * Designed for fast LLM look-up and frontend search:
 * every symbol across all files in a single sorted array.
 */
export interface IndexEntry {
    /** Symbol display name (class, method, property, or enum name) */
    symbolName: string;
    /** What kind of symbol this is */
    kind: SymbolKind;
    /** Absolute path to the source file */
    filePath: string;
    /** 1-based start line */
    startLine: number;
    /** 1-based end line */
    endLine: number;
    /** Leading JSDoc / doc-comment text if captured, otherwise null */
    docstring: string | null;
}
