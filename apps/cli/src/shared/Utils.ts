import { LANGUAGE_MAP, MIME_MAP } from "apps/cli/src/constants";
import path from "path";
import fs from "fs";
import { CliError } from "apps/cli/src/shared/ErrorHandler";

export abstract class Utils {

    /**
     * @description Validate if a metadata file exists at the given path
     * @param path 
     */
    static validateFileExistence(path: string) {
        if (!fs.existsSync(path) || !fs.statSync(path).isFile()) {
            return false
        }

        return true;
    }

    /**
     * @description Validate if a given path is a valid directory
     * @param dir - The directory path to validate
     */
    static validateDirectoryEntry(dir: string): void {
        // validate directory
        if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
            throw new CliError('Invalid directory', dir);
        }
    }

    /**
     * @description Extract the file extension from a given path
     * @param p - The file path
     * @returns The file extension without the leading dot
     */
    static extFromPath(p: string): string {
        return path.extname(p).replace(/^\./, "").toLowerCase();
    }

    /**
     * @description Get the MIME type for a given file extension
     * @param ext - The file extension
     * @returns The corresponding MIME type
     */
    static mimeForExt(ext: string): string {
        if (!ext) return "text/plain";
        return MIME_MAP[ext] ?? "text/plain";
    }

    /**
     * @description Get the programming language for a given file extension
     * @param ext - The file extension
     * @returns The corresponding programming language
     */
    static languageForExt(ext: string | undefined): string {
        if (!ext) return "text";
        return LANGUAGE_MAP[ext] ?? "text";
    }

    private static _getFileStatistics(filePath: string): fs.Stats {
        return fs.statSync(filePath);
    }
    /**
     * @description Get the creation date of a file
     * @param filePath - The relative path to the file
     * @returns The creation date of the file
     */
    static getFileCreationDate(filePath: string): Date {
        const stats = Utils._getFileStatistics(filePath);
        return stats.birthtime;
    }

    /**
     * @description Get the modification date of a file
     * @param filePath - The relative path to the file
     * @returns The modification {@link Date} of the file
     */
    static getFileModificationDate(filePath: string): Date {
        const stats = Utils._getFileStatistics(filePath);
        return stats.mtime;
    }

    /**
     * @description {@link fs.readFileSync} wrapper
     * @param filePath - The path to the file
     * @param encoding - The file encoding (default is 'utf8')
     * @returns The file content as a string
     */
    static readFileSync(filePath: string, encoding: BufferEncoding = 'utf8'): string {
        return fs.readFileSync(filePath, encoding);
    }

    /**
     * @description {@link fs.writeFileSync} wrapper
     * @param filePath - The path to the file
     * @param data - The data to write
     * @param encoding - The file encoding (default is 'utf8')
     */
    static writeFileSync(filePath: string, data: string, encoding: BufferEncoding = 'utf8'): void {
        fs.writeFileSync(filePath, data, { encoding });
    }
}