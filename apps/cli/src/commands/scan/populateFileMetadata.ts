import { promises as fs } from "fs";
import path from "path";
import { LANGUAGE_MAP, MIME_MAP } from "apps/cli/src/constants";
import { randomUUID } from "crypto";


function extFromPath(p: string): string {
    return path.extname(p).replace(/^\./, "").toLowerCase();
}

function mimeForExt(ext: string): string {
    if (!ext) return "text/plain";
    return MIME_MAP[ext] ?? "text/plain";
}

function languageForExt(ext: string | undefined): string {
    if (!ext) return "text";
    return LANGUAGE_MAP[ext] ?? "text";
}

/**
 * Populate metadata for a list of files. If an entry contains `content`, it will be used;
 * otherwise the file will be read from disk. Returns metadata for each input entry in order.
 */
export function populateFileMetadata(
    files: string[]
): FileMetadata[] {

    return files.map((file) => {
        const fileName = path.basename(file);
        const ext = extFromPath(file);

        return {
            id: randomUUID(),
            filePath: file,
            fileName,
            extension: ext,
            language: languageForExt(ext),
            createdAt: new Date(),
            modifiedAt: new Date(),
        };
    })
}

export default populateFileMetadata;