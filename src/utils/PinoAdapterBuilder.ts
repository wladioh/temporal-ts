import { context, isSpanContextValid, trace } from "@opentelemetry/api";
import pino from "pino";
import { PinoAdapter } from "@app-log-pinno";
import { ILoggerAdapter, LogLevel } from "@app-log";
import { defaultTransporter } from "../libs/app-log-pinno/defaulTransporter";
import { Configuration } from "@config";
import { NodeEnv } from "@app-config";
const injectTrace = () => {
	const record = {};
	const span = trace.getSpan(context.active());
	const spanContext = span?.spanContext();
	if (spanContext && isSpanContextValid(spanContext)) {
		Object.assign(record, {
			trace_id: spanContext.traceId,
			span_id: spanContext.spanId,
			trace_flags: `0${spanContext.traceFlags.toString(16)}`,
		});
	}
	return record;
};
export const PinoAdapterBuilder = (
	configuration?: Configuration
): ILoggerAdapter => {
	const prettyStream = defaultTransporter();
	const level = configuration?.LOG_LEVEL || LogLevel.info;
	const pinoConfig = {
		level,
		mixin: injectTrace,
		timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
	};
	const isLocal =
		configuration?.NODE_ENV === NodeEnv.LOCAL ||
		configuration?.NODE_ENV === NodeEnv.TEST;
	const logger = isLocal ? pino(pinoConfig, prettyStream) : pino(pinoConfig);
	return new PinoAdapter(logger);
};
