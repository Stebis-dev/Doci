import { Command } from 'commander';
import { SCAN_COMMAND_DESCRIPTION, SCAN_COMMAND_NAME, ScanDepth } from './scan.constants';
import { DirectoryTraverser, TraversalOptions } from 'commands/scan/DirectoryTraverser';
import { command } from 'commands/command.types';
import { PopulateMetadata } from 'commands/scan/PopulateMetadata';
import { createLogger, handleError, Logger, MetadataFile, Utils } from 'utils';
import { helpOptions, requiredOptions, scanOptions } from 'commands/command.constants';

/** Exit codes per Issue 29 spec */
const EXIT_OK = 0;
const EXIT_FATAL = 1;
const EXIT_PARTIAL = 2;

/**
 * Scans a directory and generates a metadata.json artifact.
 *
 * Flags:
 *   -d, --dir <path>       Directory to scan (default: cwd)
 *   --depth <level>        file | symbols | full  (default: file)
 *   --include <glob>       Only include files matching this glob (comma-separated, repeatable)
 *   --exclude <glob>       Exclude files matching this glob (comma-separated, repeatable)
 *   --output <path>        Write metadata to this path (default: <cwd>/metadata.json)
 *   --stdout               Print metadata JSON to stdout instead of writing a file
 *   --emit-index           Also write a flat index.json symbol lookup table (reserved)
 */
export default function scanCommand(program: Command) {
    const logger = createLogger(command.SCAN);

    program
        .command(SCAN_COMMAND_NAME)
        .description(SCAN_COMMAND_DESCRIPTION)
        .helpOption(helpOptions.HELP, 'display help for command')
        .option(requiredOptions.DIRECTORY, 'Directory to scan (default: current working directory)')
        .option(scanOptions.DEPTH, `Extraction depth: file | symbols | full (default: ${ScanDepth.FILE})`, ScanDepth.FILE)
        .option(scanOptions.INCLUDE, 'Only process files matching this glob (comma-separated, repeatable)', collect, [])
        .option(scanOptions.EXCLUDE, 'Skip files matching this glob (comma-separated, repeatable)', collect, [])
        .option(scanOptions.OUTPUT, 'Output file path (default: <cwd>/metadata.json)')
        .option(scanOptions.STDOUT, 'Print output JSON to stdout instead of writing a file')
        .option(scanOptions.EMIT_INDEX, 'Also emit a flat index.json symbol lookup table')
        .action((options) => scanAction(options, logger));
}

/** Commander value collector — supports comma-separated globs and repeated flags */
function collect(value: string, previous: string[]): string[] {
    return [...previous, ...value.split(',').map(v => v.trim()).filter(Boolean)];
}

function scanAction(options: any, logger: Logger) {
    logger.info('Executing scan command');

    const dir = options.dir as string | undefined;
    if (!dir) {
        logger.info('No directory specified — using current working directory.');
    }

    const entryDirectory = dir ? Utils.resolve(dir) : process.cwd();

    if (!Utils.validateDirectoryEntry(entryDirectory)) {
        logger.error(`Invalid directory: ${entryDirectory}`);
        process.exit(EXIT_FATAL);
    }

    const depth = (options.depth as ScanDepth) ?? ScanDepth.FILE;
    const useStdout = Boolean(options.stdout);
    const outputPath: string | null = options.output ?? null;
    const include: string[] = options.include ?? [];
    const exclude: string[] = options.exclude ?? [];

    if (depth !== ScanDepth.FILE) {
        logger.warn(`--depth ${depth} requested. Semantic extraction is not yet implemented — falling back to 'file' depth.`);
    }

    const traversalOptions: TraversalOptions = {
        include: include.length ? include : undefined,
        exclude: exclude.length ? exclude : undefined,
    };

    // Always reset static traverser state so repeated invocations in tests are safe
    DirectoryTraverser.reset();

    logger.info(`Searching for .gitignore files in: ${entryDirectory}`);
    DirectoryTraverser.findGitignoreFiles(entryDirectory);

    logger.info(`Found ${DirectoryTraverser.gitignoreFiles.length} .gitignore file(s).`);
    const ignorePatterns = DirectoryTraverser.generateIgnorePatterns();
    logger.debug(`Ignore patterns (${ignorePatterns.length}): ${ignorePatterns.join(', ')}`);

    logger.info(`Scanning: ${entryDirectory}`);
    DirectoryTraverser.traverseDirectory(entryDirectory, entryDirectory, traversalOptions);

    const files = DirectoryTraverser.files;
    logger.info(`Discovered ${files.length} file(s).`);

    const fileMetadata = PopulateMetadata.populateFileMetadata(files);
    const projectMetadata = PopulateMetadata.populateDirectoryMetadata(entryDirectory, fileMetadata);
    const metadata = PopulateMetadata.populateMetadata([projectMetadata], fileMetadata);

    const { counts } = metadata;
    const summaryLine = `Scan complete — scanned: ${counts.scanned} | processed: ${counts.processed} | skipped: ${counts.skipped} | failed: ${counts.failed}`;

    if (useStdout) {
        // Print human summary to stderr so it doesn't corrupt piped JSON
        process.stderr.write(`[Scan] ${summaryLine}\n`);
        process.stdout.write(JSON.stringify(metadata, null, 2) + '\n');
    } else {
        try {
            const metadataFilePath = MetadataFile.write(outputPath, metadata);
            logger.info(`Metadata written to: ${metadataFilePath}`);
        } catch (err) {
            handleError(err);
            process.exit(EXIT_FATAL);
        }
        logger.info(summaryLine);
    }

    // 0 = all processed, 2 = partial failures, 1 = fatal (handled above)
    process.exit(counts.failed > 0 ? EXIT_PARTIAL : EXIT_OK);
}
