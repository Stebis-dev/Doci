import { Command } from 'commander';
import { SCAN_COMMAND_DESCRIPTION, SCAN_COMMAND_NAME } from './scan.constants';
import { logger } from 'apps/cli/src/logger';
import { Scan } from 'apps/cli/src/commands/scan/ScanCommand';
// scans a directory and lists all files
export default function scanCommand(program: Command) {
    program
        .command(SCAN_COMMAND_NAME)
        .description(SCAN_COMMAND_DESCRIPTION)
        .helpOption('-h, --help', 'display help for command')
        .option("-d, --dir <path>", "directory to scan")
        .argument('[string]')
        .action((str, options) => {
            const dir = str ?? process.cwd();

            logger.info('Executing scan command');
            logger.info(`Scanning directory: ${dir}`);

            Scan.validateDirectoryEntry(dir);
            Scan.traverseDirectory(dir);

            const files = Scan.files;
            logger.info(`Found ${files.length} files.`);

            console.log(files);
        });
}