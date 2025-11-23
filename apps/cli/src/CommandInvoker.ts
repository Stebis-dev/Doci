import { Command } from './commands/ICommand';

export class Invoker {
    private command?: Command;

    setCommand(command: Command) {
        this.command = command;
    }

    async run(): Promise<void> {
        if (!this.command) {
            console.error('No command has been set.');
            return;
        }
        await this.command.execute();
    }
}
