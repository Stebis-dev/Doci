import path from "path";
import { randomUUID } from "crypto";
import { Utils } from "utils";
import { SCHEMA_VERSION } from "commands/scan/scan.constants";

export abstract class PopulateMetadata {

    /**
     * @description Populate overall metadata structure
     * @param projectMetadata - Array of {@link ProjectMetadata} objects
     * @param fileMetadata - Array of {@link FileMetadata} objects
     * @returns {@link Metadata} object
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
     * @param directoryPath - Absolute path to the scanned directory
     * @param files - Array of {@link FileMetadata} objects belonging to this directory
     * @returns {@link ProjectMetadata} object
     */
    public static populateDirectoryMetadata(
        directoryPath: string,
        files: FileMetadata[],
    ): ProjectMetadata {
        const id = randomUUID();
        const name = path.basename(directoryPath);
        const rootPath = directoryPath;
        const totalFiles = files.length;
        const fileIds: string[] = files.map(file => file.id);
        const createdAt = Utils.getFileCreationDate(directoryPath).toISOString();
        const modifiedAt = Utils.getFileModificationDate(directoryPath).toISOString();

        return {
            id,
            name,
            rootPath,
            totalFiles,
            fileIds,
            createdAt,
            modifiedAt,
        };
    }

    /**
     * @description Populate metadata for a list of files
     * @param files - Array of absolute file paths
     * @returns Array of {@link FileMetadata} objects
     */
    public static populateFileMetadata(
        files: string[]
    ): FileMetadata[] {
        return files.map((file) => {
            const id = randomUUID();
            const filePath = file;
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
                createdAt = Utils.getFileCreationDate(filePath).toISOString();
                modifiedAt = Utils.getFileModificationDate(filePath).toISOString();
                sizeBytes = Utils.getFileSizeBytes(filePath);
            } catch (err) {
                status = 'failed';
                error = err instanceof Error ? err.message : String(err);
            }

            return {
                id,
                filePath,
                fileName,
                extension,
                mimeType,
                language,
                sizeBytes,
                createdAt,
                modifiedAt,
                status,
                error,
            };
        });
    }
}