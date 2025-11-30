interface Metadata {
    projects: ProjectMetadata[];
    files: FileMetadata[];
    totalProjects: number;
    scannedAt: Date;
}

interface ProjectMetadata {
    id: string; // UUID
    name: string;
    rootPath: string;
    totalFiles: number;
    /**
     * @description List of file id in the project
     */
    fileIds: string[];
    createdAt: Date;
    modifiedAt: Date;
}

interface FileMetadata {
    /**
    * @description UUID
    */
    id: string;
    /**
    * @description relative path from project root
    */
    filePath: string;
    fileName: string;
    extension: string;
    mimeType: string;
    /**
    * @description The programming language of the file, inferred from the file extension.
    */
    language: string;
    createdAt: Date;
    modifiedAt: Date;
}