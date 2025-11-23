import { Command } from 'commander';
import { scanCommand } from './commands/scan';


const program = new Command();
program
    .name('doci-cli-tool')
    .description('{doci description here}')
    .version('{version here}');

scanCommand(program as Command);

program.parse(process.argv);