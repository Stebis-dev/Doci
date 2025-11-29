import { Command } from 'commander';
import scanCommand from './commands/scan/index.js';
import { CLI_TOOL_DESCRIPTION, CLI_TOOL_NAME, CLI_VERSION } from 'apps/cli/src/constants.js';

const program = new Command();
program
    .name(CLI_TOOL_NAME)
    .description(CLI_TOOL_DESCRIPTION)
    .version(CLI_VERSION);

scanCommand(program as Command);

program.parse(process.argv);