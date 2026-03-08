import { DEFAULT_IGNORED_FILES, DEFAULT_IGNORED_FOLDERS } from 'commands/scan/scan.constants';
import * as fs from 'fs';
import * as path from 'path';

/** Maximum directory depth to protect against infinite symlink loops */
const MAX_DEPTH = 50;

/**
 * Matches a file or directory path segment against a single gitignore-style pattern.
 *
 * Handled forms:
 *  - Exact name:       `node_modules`  → matches any entry whose basename equals the pattern
 *  - Extension glob:   `*.log`         → matches any entry whose name ends with `.log`
 *  - Directory marker: `dist/`         → matches any directory entry named `dist`
 *  - Full-path glob:   `src/ **\/*.ts` → matched via simple substring on the relative path
 */
function matchesIgnorePattern(entryName: string, entryRelPath: string, pattern: string): boolean {
    const normalized = pattern.replace(/\\/g, '/').trim();
    if (!normalized || normalized.startsWith('#')) return false;

    // Directory-only pattern (trailing slash)
    const dirPattern = normalized.endsWith('/') ? normalized.slice(0, -1) : null;
    if (dirPattern) return entryName === dirPattern;

    // Extension glob  *.ext
    if (normalized.startsWith('*.')) {
        return entryName.endsWith(normalized.slice(1));
    }

    // Exact segment match (common for folder/file names with no path separator)
    if (!normalized.includes('/')) {
        return entryName === normalized;
    }

    // Pattern contains a path separator — match against the relative path
    // Convert simple glob `**` to a regex dot-star
    const escaped = normalized.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
    return new RegExp(`(^|/)${escaped}(/|$)`).test(entryRelPath.replace(/\\/g, '/'));
}

/** Returns true if the relative path matches at least one of the provided glob strings */
function matchesAnyPattern(entryName: string, entryRelPath: string, patterns: string[]): boolean {
    return patterns.some(p => matchesIgnorePattern(entryName, entryRelPath, p));
}

export interface TraversalOptions {
    /** Additional glob patterns to ignore (on top of defaults + .gitignore) */
    extraIgnore?: string[];
    /** If provided, only files matching at least one pattern are kept */
    include?: string[];
    /** Files matching any of these patterns are skipped (applied after include) */
    exclude?: string[];
}

export abstract class DirectoryTraverser {
    private static _gitignoreFiles: string[] = [];
    public static get gitignoreFiles(): string[] {
        return this._gitignoreFiles;
    }

    private static _ignorePatterns: string[] = [];
    public static get ignorePatterns(): string[] {
        return this._ignorePatterns;
    }

    private static _files: string[] = [];
    public static get files(): string[] {
        return this._files;
    }

    /** Reset all static state — must be called before each new scan */
    public static reset(): void {
        this._gitignoreFiles = [];
        this._ignorePatterns = [];
        this._files = [];
    }

    public static findGitignoreFiles(d: string): string[] {
        let entries: string[];
        try {
            entries = fs.readdirSync(d);
        } catch {
            return this._gitignoreFiles;
        }

        for (const name of entries) {
            const full = path.join(d, name);
            let stat: fs.Stats;
            try {
                stat = fs.lstatSync(full);
            } catch {
                continue;
            }
            if (stat.isSymbolicLink()) continue;

            if (stat.isDirectory()) {
                // Skip default ignored folders when looking for .gitignore files too
                if (DEFAULT_IGNORED_FOLDERS.includes(name)) continue;
                this.findGitignoreFiles(full);
            } else if (name === '.gitignore') {
                this._gitignoreFiles.push(full);
            }
        }
        return this._gitignoreFiles;
    }

    public static generateIgnorePatterns(): string[] {
        this._ignorePatterns = [...DEFAULT_IGNORED_FOLDERS, ...DEFAULT_IGNORED_FILES];
        for (const gitignoreFile of this._gitignoreFiles) {
            try {
                const content = fs.readFileSync(gitignoreFile, 'utf-8');
                const lines = content
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#'));
                this._ignorePatterns.push(...lines);
            } catch {
                // Unreadable .gitignore — skip silently
            }
        }
        return this._ignorePatterns;
    }

    /**
     * Traverse a directory recursively, collecting absolute file paths.
     * Results are appended to `this._files` and sorted lexicographically when
     * called from the public entry point.
     *
     * @param dir     - Absolute directory path to traverse
     * @param root    - The original scan root (used for relative path computation)
     * @param options - Include/exclude overrides
     * @param depth   - Current recursion depth (internal)
     */
    public static traverseDirectory(dir: string, root?: string, options: TraversalOptions = {}, depth = 0): void {
        if (depth > MAX_DEPTH) return;

        const scanRoot = root ?? dir;
        let entries: string[];
        try {
            entries = fs.readdirSync(dir);
        } catch {
            return;
        }

        for (const name of entries) {
            const full = path.join(dir, name);
            const relPath = path.relative(scanRoot, full);

            let stat: fs.Stats;
            try {
                stat = fs.lstatSync(full);
            } catch {
                continue;
            }

            // Never follow symlinks
            if (stat.isSymbolicLink()) continue;

            // Apply built-in + gitignore patterns against the entry name and relative path
            if (matchesAnyPattern(name, relPath, this._ignorePatterns)) continue;

            // Apply caller-provided extra ignore patterns
            if (options.extraIgnore?.length && matchesAnyPattern(name, relPath, options.extraIgnore)) continue;

            if (stat.isDirectory()) {
                this.traverseDirectory(full, scanRoot, options, depth + 1);
            } else {
                // Apply exclude patterns
                if (options.exclude?.length && matchesAnyPattern(name, relPath, options.exclude)) continue;

                // Apply include patterns (if specified, files must match at least one)
                if (options.include?.length && !matchesAnyPattern(name, relPath, options.include)) continue;

                this._files.push(full);
            }
        }

        // Sort only at the top-level call (depth 0) so the final list is deterministic
        if (depth === 0) {
            this._files.sort((a, b) => a.localeCompare(b));
        }
    }
}




