import type { Metadata } from "@doci/types";
import { FileSystemUtils } from "utils/FileSystemUtils";
import { CliError } from "./ErrorHandler";
import { Utils } from "./Utils";

export class MetadataFile {
    // Placeholder for MetadataFile class implementation
    private static _defaultMetadataPath: string = 'temp/metadata.json';

    public static setMetadataPath(path: string): void {
        this._defaultMetadataPath = path;
    }

    private static getExecutableDirectory(): string {
        return FileSystemUtils.getToolExecutableRoot() ?? process.cwd();
    }

    public static getDefaultMetadataPath(): string {
        return Utils.join(this.getExecutableDirectory(), this._defaultMetadataPath);
    }

    /**
     * Resolves the given path to a metadata file path, then validates it exists.
     * - If `path` is a directory, resolves to `<path>/temp/metadata.json`.
     * - If `path` is already a file, uses it as-is.
     * - If `path` is null/undefined or the resolved file doesn't exist, falls back to
     *   the default metadata location ({@link getDefaultMetadataPath}).
     *
     * @param path - A file path, directory path, or null.
     * @returns A file path that is guaranteed to exist, or the default path as fallback.
     */
    private static checkPath(path: string | null): string {
        let metadataFilePath = path;

        if (metadataFilePath && Utils.validateDirectoryEntry(metadataFilePath)) {
            // Caller passed a directory — resolve to <dir>/temp/metadata.json
            metadataFilePath = Utils.join(metadataFilePath, this._defaultMetadataPath);
        }

        if (!metadataFilePath || !Utils.validateFileExistence(metadataFilePath)) {
            metadataFilePath = this.getDefaultMetadataPath();
        }

        return metadataFilePath;
    }

    static read(path: string | null): Metadata {
        const metadataFilePath = this.checkPath(path);

        if (!Utils.validateFileExistence(metadataFilePath)) {
            throw new CliError('Metadata file not found', metadataFilePath);
        }

        const raw = Utils.readFileSync(metadataFilePath, 'utf8');
        return JSON.parse(raw);
    }

    /**
     * Resolve the write path — uses the provided path as-is if given,
     * otherwise falls back to the default metadata.json location.
     * Unlike {@link checkPath}, this does NOT require the file to already exist.
     */
    private static resolveWritePath(p: string | null): string {
        return p ?? this.getDefaultMetadataPath();
    }

    static write(path: string | null, metadata: Metadata): string {
        const metadataFilePath = this.resolveWritePath(path);

        // create directory if it doesn't exist
        if (!Utils.validateDirectoryEntry(Utils.dirname(metadataFilePath))) {
            Utils.mkdirSync(Utils.dirname(metadataFilePath), { recursive: true });
        }

        const output = JSON.stringify(metadata, null, 2);
        Utils.writeFileSync(metadataFilePath, output, 'utf8');
        return metadataFilePath;
    }
}   