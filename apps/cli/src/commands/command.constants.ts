export enum requiredOptions {
    DIRECTORY = "-d, --dir <path>",
    FILTER = "-f, --filter <items>"
}

export enum optionalOptions {
    DIRECTORY = "-d, --dir [path]",
    FILTER = "-f, --filter [items]"
}

export enum helpOptions {
    HELP = '-h, --help',
}

export enum scanOptions {
    /** Extraction depth: file | symbols | full */
    DEPTH = '--depth <level>',
    /** Glob patterns to include (comma-separated or repeated flag) */
    INCLUDE = '--include <glob>',
    /** Glob patterns to exclude (comma-separated or repeated flag) */
    EXCLUDE = '--exclude <glob>',
    /** Print output JSON to stdout instead of writing a file */
    STDOUT = '--stdout',
    /** Override the output file path (default: <cwd>/metadata.json) */
    OUTPUT = '--output <path>',
    /** Also emit a flat index.json symbol lookup table */
    EMIT_INDEX = '--emit-index',
}