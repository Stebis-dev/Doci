import { Command } from 'commander';
import { createLogger, Logger } from 'apps/cli/src/shared/Logger';
import { command } from 'apps/cli/src/commands/command.types';
import { helpOptions, optionalOptions } from 'apps/cli/src/commands/command.constants';
import { EXTRACT_COMMAND_DESCRIPTION, EXTRACT_COMMAND_NAME } from 'apps/cli/src/commands/extract/extract.constants';
import { MetadataFile } from 'apps/cli/src/shared/MetadataFile';
import { TreeSitterParser } from 'apps/cli/src/controllers/Parser';
import { Utils } from 'apps/cli/src/shared/Utils';
import { isLanguageSupported } from 'apps/cli/src/controllers/parser.types';

export default function extractCommand(program: Command) {
    const logger = createLogger(command.EXTRACT);

    program
        .command(EXTRACT_COMMAND_NAME)
        .description(EXTRACT_COMMAND_DESCRIPTION)
        .helpOption(helpOptions.HELP, 'display help for command')
        .option(optionalOptions.DIRECTORY, "directory to extract data from")
        .action((options) => extractAction(options, logger));
}

async function extractAction(options: any, logger: Logger) {
    logger.info('Executing extract command');
    const dir = options.dir as string | null;

    if (!dir) {
        logger.info('No directory specified for show command, current directory will be used.');
    }

    const metadata = MetadataFile.read(dir);
    const fileMetadata = metadata.files;

    const categorizedFileMetadata: Record<string, typeof fileMetadata> = {};
    for (const file of fileMetadata) {
        if (!categorizedFileMetadata[file.language]) {
            categorizedFileMetadata[file.language] = [];
        }
        categorizedFileMetadata[file.language].push(file);
    }
    // console.log('Categorized File Metadata:', categorizedFileMetadata);
    // setup parser for each language and extract details
    for (const language in categorizedFileMetadata) {
        if (!isLanguageSupported(language))
            continue;

        logger.info(`Extracting details for language: ${language}`);
        const files = categorizedFileMetadata[language];
        const parser = new TreeSitterParser();
        await parser.initialize(language);

        for (const file of files) {
            const filePath = file.filePath;
            const fileContent = Utils.readFileSync(filePath);
            const ast = parser.parse(fileContent);
            console.log(ast);
        }
    }

    logger.info('Extract command completed successfully.');
}

