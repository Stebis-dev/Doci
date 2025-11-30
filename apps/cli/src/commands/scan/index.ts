import { Command } from 'commander';
import { SCAN_COMMAND_DESCRIPTION, SCAN_COMMAND_NAME } from './scan.constants';
import { createLogger, Logger } from 'apps/cli/src/shared/Logger';
import { DirectoryTraverser } from 'apps/cli/src/commands/scan/DirectoryTraverser';
import { command } from 'apps/cli/src/commands/command.types';
import { PopulateMetadata } from 'apps/cli/src/commands/scan/PopulateMetadata';
import { Utils } from 'apps/cli/src/shared/Utils';
import { MetadataFile } from 'apps/cli/src/shared/MetadataFile';
import { helpOptions, requiredOptions } from 'apps/cli/src/commands/command.constants';

// scans a directory and lists all files
export default function scanCommand(program: Command) {
    const logger = createLogger(command.SCAN);

    program
        .command(SCAN_COMMAND_NAME)
        .description(SCAN_COMMAND_DESCRIPTION)
        .helpOption(helpOptions.HELP, 'display help for command')
        .option(requiredOptions.DIRECTORY, "directory to scan")
        .action((options) => scanAction(options, logger));
}

function scanAction(options: any, logger: Logger) {
    logger.info('Executing scan command');

    const dir = options.dir as string | null; // TODO add full path
    if (!dir) {
        logger.info('No directory specified for scan command, current directory will be used.');
    }

    const entryDirectory = dir ?? process.cwd();
    if (!Utils.validateDirectoryEntry(entryDirectory)) {
        logger.error(`Invalid directory: ${entryDirectory}`);
        return;
    }

    logger.info(`Searching for .gitignore files in: ${entryDirectory}`);
    DirectoryTraverser.findGitignoreFiles(entryDirectory);
    const gitignoreFiles = DirectoryTraverser.gitignoreFiles;

    logger.info(`Found ${gitignoreFiles.length} .gitignore files.`);
    const ignorePatterns = DirectoryTraverser.generateIgnorePatterns();
    logger.debug(`Ignore patterns: ${ignorePatterns.join(', ')}`);

    logger.info(`Scanning directory: ${entryDirectory}`);
    DirectoryTraverser.traverseDirectory(entryDirectory);

    const files = DirectoryTraverser.files;
    logger.info(`Found ${files.length} files.`);

    const fileMetadata = PopulateMetadata.populateFileMetadata(files);
    const projectMetadata = PopulateMetadata.populateDirectoryMetadata(entryDirectory, fileMetadata);
    const metadata = PopulateMetadata.populateMetadata([projectMetadata], fileMetadata);

    const metadataFilePath = MetadataFile.write(null, metadata);
    logger.info(`Metadata written to file: ${metadataFilePath}`);
    logger.info('Scan command completed successfully.');
}

