import { LogLevel, ILoggerAdapter } from "@app-log";
import pinoElastic from "pino-elasticsearch";
import pino from "pino";
import { PinoAdapter } from "./PinoAdapter";
import { PinoConfig, PinoElasticSearchConfig } from "./PinoConfig";
import { defaulTransporter } from "./defaulTransporter";
const defaultConfig: PinoElasticSearchConfig = {
	CONSISTENCY: "one",
	INDEX: "service.logs",
	LOG_LEVEL: LogLevel.info,
	SERVER_ADDRESS: "",
};

export const PinoElasticSearchAdapterBuilder = (
	configuration?: PinoElasticSearchConfig
): ILoggerAdapter => {
	const prettyStream = defaulTransporter();
	const streams = [{ stream: prettyStream }];
	const config = Object.assign<{}, PinoElasticSearchConfig>(
		configuration || {},
		defaultConfig
	);
	if (configuration) {
		const streamToElastic = pinoElastic({
			index: config.INDEX,
			consistency: config.CONSISTENCY,
			node: config.SERVER_ADDRESS,
			"es-version": 7,
			"flush-bytes": 1000,
			"flush-interval": 5000,
		});
		streamToElastic.on("insertError", (error) => {
			const documentThatFailed = error.document;
			console.log(`An error occurred insert document:`, documentThatFailed);
		});
		streamToElastic.on("error", (error) => {
			console.error("Elasticsearch client error:", error);
		});
		streamToElastic.on("unknown", (error) => {
			console.error("Elasticsearch client error:", error);
		});
		streamToElastic.on("insert", (stats: Record<string, any>) => {
			console.error("Elasticsearch client error:", stats);
		});
		streams.push({ stream: streamToElastic });
	}
	pino.multistream(streams);
	const logger = pino({ level: config.LOG_LEVEL }, pino.multistream(streams));
	return new PinoAdapter(logger);
};

export const PinoAdapterBuilder = (
	configuration?: PinoConfig
): ILoggerAdapter => {
	const prettyStream = defaulTransporter();
	const streams = [{ stream: prettyStream }];
	pino.multistream(streams);
	const level = configuration?.LOG_LEVEL || LogLevel.info;
	const logger = pino({ level }, pino.multistream(streams));
	return new PinoAdapter(logger);
};
