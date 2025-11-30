import { Command } from 'commander';
import { createLogger, Logger } from 'apps/cli/src/shared/Logger';
import { command } from 'apps/cli/src/commands/command.types';
import { MetadataFile } from 'apps/cli/src/shared/MetadataFile';
import { SHOW_COMMAND_DESCRIPTION, SHOW_COMMAND_NAME } from 'apps/cli/src/commands/show/show.constants';

// show metadata command
export default function showCommand(program: Command) {
    const logger = createLogger(command.SHOW);

    program
        .command(SHOW_COMMAND_NAME)
        .description(SHOW_COMMAND_DESCRIPTION)
        .option("-d, --dir <path>", "directory to scan")
        .argument('[string]')
        .action((str, options) => showAction(str, options, logger));
}

function showAction(str: string, options: any, logger: Logger) {
    logger.info('Executing show command');

    if (!str) {
        logger.info('No directory specified for show command, current directory will be used.');
    }
    // TODO add option to specify metadata file path
    // TODO add options to specify what to show (summary, files, projects, etc)

    const metadataFilePath = MetadataFile.read(null);
    logger.info(`Metadata read from file: ${metadataFilePath}`);
    logger.info('Show command completed successfully.');
}

