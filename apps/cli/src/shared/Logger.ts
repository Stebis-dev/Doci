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
            console.log(message);
            return;
        }

        console.log(this.format("info", message));
    }

    warn(message: string) {
        console.warn(this.format("warn", message));
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