import { Command } from 'commander';
import { helpOptions, optionalOptions } from 'commands/command.constants';
import { command } from 'commands/command.types';
import { Parser } from 'controllers/Parser';
import { createLogger, Logger } from 'utils';
import { MetadataFile } from 'utils/MetadataFile';

const EXTRACT_COMMAND_NAME = 'extract';
const EXTRACT_COMMAND_DESCRIPTION = 'Extract data from files';

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

    const parser = new Parser();
    await parser.initialize();

    // console.log('Categorized File Metadata:', categorizedFileMetadata);
    // setup parser for each language and extract details

    // for (const language in categorizedFileMetadata) {
    //     if (!isLanguageSupported(language))
    //         continue;

    //     logger.info(`Extracting details for language: ${language}`);
    //     const files = categorizedFileMetadata[language];

    //     // for (const file of files) {
    //     //     const filePath = file.filePath;
    //     //     const fileContent = Utils.readFileSync(filePath);
    //     //     const ast = parser.parse(fileContent);
    //     //     // console.log(ast);
    //     // }
    // }

    logger.info('Extract command completed successfully.');
}

