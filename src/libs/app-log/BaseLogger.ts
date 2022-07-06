import { ILogger, LogLevel } from "@app-api/LoggerApi";

export interface ILoggerAdapter {
	changeLevel(level: LogLevel): void;
	getChild(scope: string): ILogger;
}
