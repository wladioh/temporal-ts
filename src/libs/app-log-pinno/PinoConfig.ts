import { LogLevel } from "@app-api/LoggerApi";

export type PinoConfig = {
	LOG_LEVEL: LogLevel;
};

export type PinoElasticSearchConfig = PinoConfig & {
	SERVER_ADDRESS: string;
	INDEX: string;
	CONSISTENCY: string;
};
