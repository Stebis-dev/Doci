import path from "path";
import { randomUUID } from "crypto";
import { Utils } from "apps/cli/src/shared/Utils";

export abstract class PopulateMetadata {

    /**
     * @description Populate overall metadata structure
     * @param projectMetadata - Array of {@link ProjectMetadata} objects
     * @param fileMetadata - Array of {@link FileMetadata} objects
     * @returns {@link Metadata} object
     */
    static populateMetadata(projectMetadata: ProjectMetadata[], fileMetadata: FileMetadata[]): Metadata {
        return {
            projects: projectMetadata,
            files: fileMetadata,
            totalProjects: projectMetadata.length,
            scannedAt: new Date()
        };
    }

    /**
     * @description Populate metadata for a directory
     * @param directoryPath 
     * @param files - Array of {@link FileMetadata} objects 
     * @returns {@link ProjectMetadata} object
     */
    public static populateDirectoryMetadata(
        directoryPath: string,
        files: FileMetadata[],
    ): ProjectMetadata {
        const id = randomUUID();
        const name = directoryPath.split('/').pop() || '';
        const rootPath = directoryPath;
        const totalFiles = files.length;
        const fileIds: string[] = files.map(file => file.id);
        const createdAt = Utils.getFileCreationDate(directoryPath);
        const modifiedAt = Utils.getFileModificationDate(directoryPath);

        return {
            id,
            name,
            rootPath,
            totalFiles,
            fileIds,
            createdAt,
            modifiedAt
        };
    }

    /**
    * @description Populate metadata for a list of files
    * @param files - Array of relative file paths
    * @returns Array of {@link FileMetadata}  objects
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
            const createdAt = Utils.getFileCreationDate(filePath);
            const modifiedAt = Utils.getFileModificationDate(filePath);

            return {
                id,
                filePath,
                fileName,
                extension,
                mimeType,
                language,
                createdAt,
                modifiedAt
            };
        });
    }
}