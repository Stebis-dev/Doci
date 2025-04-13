export interface FlatProject {
    name: string;
    path: string;
    files: ProjectFile[];
    totalFiles?: number;
    parsableFiles?: number;
    lastImported?: Date;
}

export interface ProjectFile {
    name: string;
    path: string;
    content?: string;
    type?: string;
}