import { Command } from 'commander';

export function scanCommand(program: Command) {
    program
        .command('scan')
        .description('Scan a directory for files')
        .action(() => {
            console.log('Scan command loaded');
        });
}