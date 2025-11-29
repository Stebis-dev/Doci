interface ProjectMetadata {
    id: string; // UUID
    name: string;
    rootPath: string;
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
    /**
    * @description The programming language of the file, inferred from the file extension.
    */
    language: string;
    createdAt: Date;
    modifiedAt: Date;
}