import path from "path";
import { randomUUID } from "crypto";
import { Utils } from "utils";
import { SCHEMA_VERSION } from "commands/scan/scan.constants";
import type { ExtractedDetails } from "controllers/extract.types";

export abstract class PopulateMetadata {

    /**
     * @description Populate overall metadata structure
     */
    static populateMetadata(projectMetadata: ProjectMetadata[], fileMetadata: FileMetadata[]): Metadata {
        const counts: ScanCounts = {
            scanned: fileMetadata.length,
            processed: fileMetadata.filter(f => f.status === 'processed').length,
            skipped: fileMetadata.filter(f => f.status === 'skipped').length,
            failed: fileMetadata.filter(f => f.status === 'failed').length,
        };

        return {
            instanceId: randomUUID(),
            schemaVersion: SCHEMA_VERSION,
            generatedAt: new Date().toISOString(),
            projects: projectMetadata,
            files: fileMetadata,
            totalProjects: projectMetadata.length,
            counts,
        };
    }

    /**
     * @description Populate metadata for a directory
     */
    public static populateDirectoryMetadata(
        directoryPath: string,
        files: FileMetadata[],
    ): ProjectMetadata {
        return {
            id: randomUUID(),
            name: path.basename(directoryPath),
            rootPath: directoryPath,
            totalFiles: files.length,
            fileIds: files.map(f => f.id),
            createdAt: Utils.getFileCreationDate(directoryPath).toISOString(),
            modifiedAt: Utils.getFileModificationDate(directoryPath).toISOString(),
        };
    }

    /**
     * @description Populate metadata for a list of files
     * @param files      - Absolute file paths
     * @param symbolsMap - Optional map of filePath → ExtractedDetails from the orchestrator.
     *                     When provided, the status/error/symbols fields are overridden
     *                     with the extraction outcome.
     */
    public static populateFileMetadata(
        files: string[],
        symbolsMap?: Map<string, { symbols: ExtractedDetails | null; status: 'processed' | 'skipped' | 'failed'; error: string | null }>,
    ): FileMetadata[] {
        return files.map((file) => {
            const id = randomUUID();
            const fileName = path.basename(file);
            const extension = Utils.extFromPath(file);
            const language = Utils.languageForExt(extension);
            const mimeType = Utils.mimeForExt(extension);

            let sizeBytes = 0;
            let createdAt = new Date().toISOString();
            let modifiedAt = new Date().toISOString();
            let status: FileStatus = 'processed';
            let error: string | null = null;

            try {
                createdAt = Utils.getFileCreationDate(file).toISOString();
                modifiedAt = Utils.getFileModificationDate(file).toISOString();
                sizeBytes = Utils.getFileSizeBytes(file);
            } catch (err) {
                status = 'failed';
                error = err instanceof Error ? err.message : String(err);
            }

            // If extraction was run, override status/error/symbols with its outcome
            const extraction = symbolsMap?.get(file);
            if (extraction) {
                status = extraction.status;
                error = extraction.error;
            }

            return {
                id,
                filePath: file,
                fileName,
                extension,
                mimeType,
                language,
                sizeBytes,
                createdAt,
                modifiedAt,
                status,
                error,
                symbols: extraction?.symbols ?? null,
            };
        });
    }
}