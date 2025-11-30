import { Command } from 'commander';
import { createLogger, Logger } from 'apps/cli/src/shared/Logger';
import { command } from 'apps/cli/src/commands/command.types';
import { MetadataFile } from 'apps/cli/src/shared/MetadataFile';
import { SHOW_COMMAND_DESCRIPTION, SHOW_COMMAND_NAME } from 'apps/cli/src/commands/show/show.constants';
import { helpOptions, requiredOptions } from 'apps/cli/src/commands/command.constants';

// show metadata command
export default function showCommand(program: Command) {
    const logger = createLogger(command.SHOW);

    program
        .command(SHOW_COMMAND_NAME)
        .description(SHOW_COMMAND_DESCRIPTION)
        .helpOption(helpOptions.HELP, 'display help for command')
        .option(
            requiredOptions.FILTER,
            "what to display: projects, files, summary, all",
            "all" // default value
        )
        .option(
            requiredOptions.DIRECTORY,
            "directory to show metadata from",
            "." // default value
        )
        .action((options) => {
            showAction(options, logger);
        });
}

function showAction(options: any, logger: Logger) {
    logger.info('Executing show command');
    const dir = options.dir as string | null;

    if (!dir) {
        logger.info('No directory specified for show command, current directory will be used.');
    }

    const metadataFilePath = MetadataFile.read(dir);

    const selected = normalizeShowOption(options.filter);
    logger.info(`Show options selected: ${selected.join(', ')}`);

    if (selected.includes("summary")) {
        logger.info('[Summary]');
        logger.info(`Projects: ${metadataFilePath.projects.length}`);
        logger.info(`Files: ${metadataFilePath.files.length}`);
    }

    if (selected.includes("projects")) {
        logger.info('[Projects]');
        logger.info(metadataFilePath.projects);
    }

    if (selected.includes("files")) {
        logger.info('[Files]');
        logger.info(metadataFilePath.files);
    }

    logger.info('Show command completed successfully.');
}

function normalizeShowOption(input: string): string[] {
    if (!input || input === "all") return ["projects", "files", "summary"];

    return input
        .split(",")
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
}