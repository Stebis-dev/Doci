import { Command } from 'commander';
import { SCAN_COMMAND_DESCRIPTION, SCAN_COMMAND_NAME } from './scan.constants';
import { createLogger, Logger } from 'apps/cli/src/shared/Logger';
import { DirectoryTraverser } from 'apps/cli/src/commands/scan/DirectoryTraverser';
import { command } from 'apps/cli/src/commands/command.types';
import { PopulateMetadata } from 'apps/cli/src/commands/scan/PopulateMetadata';
import { Utils } from 'apps/cli/src/shared/Utils';
import { MetadataFile } from 'apps/cli/src/shared/MetadataFile';

// scans a directory and lists all files
export default function scanCommand(program: Command) {
    const logger = createLogger(command.SCAN);

    program
        .command(SCAN_COMMAND_NAME)
        .description(SCAN_COMMAND_DESCRIPTION)
        .helpOption('-h, --help', 'display help for command')
        .option("-d, --dir <path>", "directory to scan")
        .argument('[string]')
        .action((str, options) => scanAction(str, options, logger));
}

function scanAction(str: string, options: any, logger: Logger) {
    logger.info('Executing scan command');

    if (!str) {
        logger.info('No directory specified for scan command, current directory will be used.');
    }

    const entryDirectory = str ?? process.cwd();
    // TODO if doesn't exist directory, should show simple message and exit, no stack traverseDirectory
    Utils.validateDirectoryEntry(entryDirectory);

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

