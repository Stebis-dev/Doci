import { Command } from 'commander';
import { helpOptions, requiredOptions, scanOptions } from 'commands/command.constants';
import { command } from 'commands/command.types';
import { DirectoryTraverser, TraversalOptions } from 'commands/scan/DirectoryTraverser';
import { PopulateMetadata } from 'commands/scan/PopulateMetadata';
import { ExtractionOrchestrator } from 'controllers/ExtractionOrchestrator';
import { IndexBuilder } from 'controllers/IndexBuilder';
import { SymbolResolver } from 'controllers/SymbolResolver';
import type { ExtractedDetails } from 'controllers/extract.types';
import { createLogger, handleError, IndexFile, Logger, MetadataFile, Utils } from 'utils';
import { SCAN_COMMAND_DESCRIPTION, SCAN_COMMAND_NAME, ScanDepth } from './scan.constants';

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
 *   --emit-index           Also write a flat index.json symbol lookup table
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
        .action(async (options) => {
            try {
                await scanAction(options, logger);
            } catch (err) {
                handleError(err);
                process.exit(EXIT_FATAL);
            }
        });
}

/** Commander value collector — supports comma-separated globs and repeated flags */
function collect(value: string, previous: string[]): string[] {
    return [...previous, ...value.split(',').map(v => v.trim()).filter(Boolean)];
}

async function scanAction(options: any, logger: Logger) {
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

    const traversalOptions: TraversalOptions = {
        include: include.length ? include : undefined,
        exclude: exclude.length ? exclude : undefined,
    };

    // Reset static traverser state for this run
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

    // ── Semantic extraction (depth = symbols | full) ──────────────────────────
    let symbolsMap: Map<string, { symbols: ExtractedDetails | null; status: 'processed' | 'skipped' | 'failed'; error: string | null }> | undefined;

    if (depth !== ScanDepth.FILE) {
        logger.info(`Running semantic extraction at depth: ${depth}`);
        symbolsMap = new Map();

        let extractCount = 0;
        for (const filePath of files) {
            const ext = Utils.extFromPath(filePath);
            const language = Utils.languageForExt(ext);
            const result = await ExtractionOrchestrator.extractFromFile(filePath, language, depth);
            symbolsMap.set(filePath, result);
            if (result.status === 'processed') extractCount++;
        }

        logger.info(`Extraction complete — ${extractCount}/${files.length} file(s) extracted.`);
    }

    // ── Metadata assembly ─────────────────────────────────────────────────────
    const fileMetadata = PopulateMetadata.populateFileMetadata(files, symbolsMap);

    // ── Cross-file symbol resolution ──────────────────────────────────────────
    if (symbolsMap) {
        const { resolved } = SymbolResolver.run(fileMetadata);
        logger.info(`Symbol resolution complete — ${resolved} inheritance reference(s) resolved.`);
    }

    const projectMetadata = PopulateMetadata.populateDirectoryMetadata(entryDirectory, fileMetadata);
    const metadata = PopulateMetadata.populateMetadata([projectMetadata], fileMetadata);

    const { counts } = metadata;
    const summaryLine = `Scan complete — scanned: ${counts.scanned} | processed: ${counts.processed} | skipped: ${counts.skipped} | failed: ${counts.failed}`;

    // ── Output ────────────────────────────────────────────────────────────────
    if (useStdout) {
        process.stderr.write(`[Scan] ${summaryLine}\n`);
        process.stdout.write(JSON.stringify(metadata, null, 2) + '\n');
    } else {
        try {
            const metadataFilePath = MetadataFile.write(outputPath, metadata);
            logger.info(`Metadata written to: ${metadataFilePath}`);

            if (options.emitIndex) {
                const entries = IndexBuilder.buildIndex(fileMetadata);
                const indexFilePath = IndexFile.write(metadataFilePath, entries);
                logger.info(`Index written to: ${indexFilePath} (${entries.length} symbol(s))`);
            }
        } catch (err) {
            handleError(err);
            process.exit(EXIT_FATAL);
        }
        logger.info(summaryLine);
    }

    process.exit(counts.failed > 0 ? EXIT_PARTIAL : EXIT_OK);
}
