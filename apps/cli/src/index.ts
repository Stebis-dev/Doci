import { Command } from 'commander';
import extractCommand from 'commands/extract.command';
import showCommand from 'commands/show.command';
import scanCommand from './commands/scan/scan.command';

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FileSystemUtils } from 'utils/FileSystemUtils';

import pkg from "../package.json";

const CLI_VERSION = pkg.version;
const CLI_TOOL_NAME = 'doci-cli-tool';
const CLI_TOOL_DESCRIPTION = 'Doci Command Line Interface Tool';

import path from "path";

if (process.versions.bun) {
    process.stderr.write('Bun detected, adjusting path resolution\n');
    const __dirname = path.dirname(process.execPath);
    process.stderr.write(__dirname + '\n');

    FileSystemUtils.setToolExecutableRoot(__dirname);
}
else {
    // Setting executable root for standard Node.js environment
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    FileSystemUtils.setToolExecutableRoot(__dirname);
}

const program = new Command();
program
    .name(CLI_TOOL_NAME)
    .description(CLI_TOOL_DESCRIPTION)
    .version(CLI_VERSION);

scanCommand(program as Command);
showCommand(program as Command);
extractCommand(program as Command);

program.parse(process.argv);