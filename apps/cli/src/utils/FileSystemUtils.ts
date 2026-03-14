/**
 * Utility class for resolving file-system paths that depend on the runtime environment.
 *
 * The primary concern is determining the "executable root" — the directory that should
 * be used as the base for default output paths (e.g. `temp/metadata.json`).  This
 * differs between environments:
 *
 * - **Bun compiled binary**: `index.ts` calls {@link setToolExecutableRoot} with
 *   `path.dirname(process.execPath)` so output lands beside the binary.
 * - **Node.js / development**: `index.ts` calls {@link setToolExecutableRoot} with the
 *   ESM `__dirname` equivalent, keeping output relative to the source entry point.
 * - **Tests**: the root is never set; callers should fall back to `process.cwd()`.
 */
export abstract class FileSystemUtils {
    private static toolExecutableRoot: string | null = null;

    /**
     * Stores the resolved executable root directory.
     * Must be called once at process startup (in `index.ts`) before any path resolution occurs.
     *
     * @param root - Absolute path to the directory that contains (or should own) output files.
     */
    static setToolExecutableRoot(root: string): void {
        FileSystemUtils.toolExecutableRoot = root;
    }

    /**
     * Returns the executable root directory previously set by {@link setToolExecutableRoot},
     * or `null` if it has not been initialized (e.g. in unit tests).
     */
    static getToolExecutableRoot(): string | null {
        return FileSystemUtils.toolExecutableRoot;
    }
}