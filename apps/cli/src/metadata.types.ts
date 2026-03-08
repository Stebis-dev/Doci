/** Counts reported at the end of a scan run */
interface ScanCounts {
    /** Total files discovered during traversal */
    scanned: number;
    /** Files successfully parsed / catalogued */
    processed: number;
    /** Files skipped (unsupported type, size limit, exclude rule) */
    skipped: number;
    /** Files where processing raised an error */
    failed: number;
}

interface ProjectMetadata {
    /** @description UUID */
    id: string;
    /** @description Directory / project name */
    name: string;
    /** @description Absolute root path of the scanned directory */
    rootPath: string;
    totalFiles: number;
    /** @description IDs of every FileMetadata entry belonging to this project */
    fileIds: string[];
    /** @description ISO-8601 creation timestamp */
    createdAt: string;
    /** @description ISO-8601 last-modified timestamp */
    modifiedAt: string;
}

interface Metadata {
    /** @description UUID for this specific scan run */
    instanceId: string;
    /** @description Schema version – increment when shape changes */
    schemaVersion: string;
    /** @description ISO-8601 timestamp of when the scan completed */
    generatedAt: string;
    projects: ProjectMetadata[];
    files: FileMetadata[];
    totalProjects: number;
    counts: ScanCounts;
}

type FileStatus = 'processed' | 'skipped' | 'failed';

interface FileMetadata {
    /** @description UUID */
    id: string;
    /** @description Absolute path to the file */
    filePath: string;
    /** @description The name of the file */
    fileName: string;
    /** @description The file extension without leading dot */
    extension: string;
    /** @description The MIME type of the file */
    mimeType: string;
    /** @description The programming language of the file, inferred from the file extension */
    language: string;
    /** @description File size in bytes */
    sizeBytes: number;
    /** @description ISO-8601 creation timestamp */
    createdAt: string;
    /** @description ISO-8601 last-modified timestamp */
    modifiedAt: string;
    /** @description Processing outcome for this file */
    status: FileStatus;
    /** @description Human-readable reason when status is skipped or failed */
    error: string | null;
}