import { Utils } from "./Utils";

/**
 * Writes (and reads) the flat symbol index file (index.json).
 *
 * The index is always placed in the same directory as metadata.json so that
 * consumers can find it with a simple path substitution.
 */
export class IndexFile {
    /**
     * Derive the `index.json` path from the resolved `metadata.json` path.
     * e.g. `/project/metadata.json` → `/project/index.json`
     */
    static getIndexPath(metadataFilePath: string): string {
        return Utils.join(Utils.dirname(metadataFilePath), 'index.json');
    }

    /**
     * Serialize `entries` to `index.json` next to the given metadata file.
     * Creates the target directory if needed.
     * @returns The absolute path where `index.json` was written.
     */
    static write(metadataFilePath: string, entries: IndexEntry[]): string {
        const indexPath = IndexFile.getIndexPath(metadataFilePath);
        const dir = Utils.dirname(indexPath);

        if (!Utils.validateDirectoryEntry(dir)) {
            Utils.mkdirSync(dir, { recursive: true });
        }

        Utils.writeFileSync(indexPath, JSON.stringify(entries, null, 2));
        return indexPath;
    }

    /** Read and parse an existing `index.json`. */
    static read(metadataFilePath: string): IndexEntry[] {
        const indexPath = IndexFile.getIndexPath(metadataFilePath);
        const raw = Utils.readFileSync(indexPath);
        return JSON.parse(raw) as IndexEntry[];
    }
}
