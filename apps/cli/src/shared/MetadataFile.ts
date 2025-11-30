import { CliError } from "apps/cli/src/shared/ErrorHandler";
import { Utils } from "apps/cli/src/shared/Utils";

export class MetadataFile {
    // Placeholder for MetadataFile class implementation
    private static _defaultMetadataPath: string = 'metadata.json';

    public static setMetadataPath(path: string): void {
        this._defaultMetadataPath = path;
    }

    private static getExecutableDirectory(): string {
        if ((process as any).pkg) {
            // Running as packaged .exe
            return Utils.dirname(process.execPath);
        }

        // Development mode (Node.js)
        return Utils.join(process.cwd(), './temp');
    }

    public static getDefaultMetadataPath(): string {
        return Utils.join(this.getExecutableDirectory(), this._defaultMetadataPath);
    }

    /**
     * @description Check if given path is valid, if not returns default metadata file path
     * @param path - Path to the metadata file
     * @returns Validated metadata file path
     */
    private static checkPath(path: string | null): string {
        let metadataFilePath = path;
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

    static write(path: string | null, metadata: Metadata): string {
        const metadataFilePath = this.checkPath(path);
        let output: string;

        // create directory if it doesn't exist
        if (!Utils.validateDirectoryEntry(Utils.dirname(metadataFilePath))) {
            Utils.mkdirSync(Utils.dirname(metadataFilePath), { recursive: true });
        }

        output = JSON.stringify(metadata, null, 2);
        Utils.writeFileSync(metadataFilePath, output, 'utf8');
        return metadataFilePath;
    }
}   