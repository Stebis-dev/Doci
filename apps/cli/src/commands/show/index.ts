import { Command } from 'commander';
import { helpOptions, requiredOptions } from 'commands/command.constants';
import { command } from 'commands/command.types';
import { SHOW_COMMAND_DESCRIPTION, SHOW_COMMAND_NAME } from 'commands/show/show.constants';
import { createLogger, Logger, MetadataFile } from 'utils';

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
            "directory containing metadata.json to show information from"
        )
        .action((options) => {
            showAction(options, logger);
        });
}

function showAction(options: any, logger: Logger) {
    logger.info('Executing show command');
    const metadataPath = options.dir as string | null;

    if (!metadataPath) {
        logger.info('No metadata file specified for show command, default metadata location will be used.');
    }

    const metadataFilePath = MetadataFile.read(metadataPath);

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