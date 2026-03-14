export type LogLevel = "info" | "warn" | "error" | "debug";
// TODO add a file writer for logger
export class Logger {
    constructor(private namespace = "app") { }

    private format(level: LogLevel, message: string) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${this.namespace}] [${level.toUpperCase()}] ${message}`;
    }

    info(message: string | any) {
        if (typeof message !== "string") {
            process.stderr.write(JSON.stringify(message) + '\n');
            return;
        }

        process.stderr.write(this.format("info", message) + '\n');
    }

    warn(message: string) {
        process.stderr.write(this.format("warn", message) + '\n');
    }

    error(message: string, error?: unknown) {
        console.error(this.format("error", message));
        if (error) console.error(error);
    }

    debug(message: string) {
        if (process.env.DEBUG) {
            console.debug(this.format("debug", message));
        }
    }
}

export const createLogger = (namespace: string) => new Logger(namespace);