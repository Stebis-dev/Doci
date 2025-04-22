import { Tree } from "web-tree-sitter";
import { ExtractedDetails } from "./extractor.model";

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
    AST?: Tree; // Tree-sitter AST
    details?: ExtractedDetails; // Extracted details from the AST
}

