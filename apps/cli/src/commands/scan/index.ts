import { Command } from 'commander';
import { SCAN_COMMAND_DESCRIPTION, SCAN_COMMAND_NAME } from './scan.constants';
import { createLogger, Logger } from 'apps/cli/src/logger';
import { DirectoryTraverser } from 'apps/cli/src/commands/scan/DirectoryTraverser';
import { command } from 'apps/cli/src/commands/command.types';
import populateFileMetadata from 'apps/cli/src/commands/scan/populateFileMetadata';

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

    const dir = str ?? process.cwd();
    DirectoryTraverser.validateDirectoryEntry(dir);

    logger.info(`Searching for .gitignore files in: ${dir}`);
    DirectoryTraverser.findGitignoreFiles(dir);
    const gitignoreFiles = DirectoryTraverser.gitignoreFiles;

    logger.info(`Found ${gitignoreFiles.length} .gitignore files.`);
    const ignorePatterns = DirectoryTraverser.generateIgnorePatterns();
    logger.debug(`Ignore patterns: ${ignorePatterns.join(', ')}`);

    logger.info(`Scanning directory: ${dir}`);
    DirectoryTraverser.traverseDirectory(dir);

    const files = DirectoryTraverser.files;
    logger.info(`Found ${files.length} files.`);

    const metadata = populateFileMetadata(files);
    console.log(metadata);

    // create file metadata objects

    // console.log(files);
}

