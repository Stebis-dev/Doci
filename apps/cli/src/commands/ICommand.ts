export interface Command {
    /** Execute the command. Can return void or a Promise. */
    execute(): void | Promise<void>;
}

