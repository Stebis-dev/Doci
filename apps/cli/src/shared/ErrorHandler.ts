import { createLogger } from "apps/cli/src/shared/Logger";

export class CliError extends Error {
    constructor(message: string, public details?: unknown) {
        super(message);
        this.name = "CliError";
    }
}

export const wrap =
    <T extends (...args: any[]) => Promise<any>>(fn: T) =>
        async (...args: Parameters<T>): Promise<ReturnType<T>> => {
            try {
                return await fn(...args);
            } catch (err) {
                handleError(err);
                process.exit(1);
            }
        };

// Central error handler
export const handleError = (error: unknown) => {
    const logger = createLogger("ERROR");

    if (error instanceof CliError) {
        logger.error(error.message, error.details);
    } else if (error instanceof Error) {
        logger.error(error.message, error.stack);
    } else {
        logger.error("Unknown error", error);
    }
};
