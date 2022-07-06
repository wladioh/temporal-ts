import { trace, Tracer } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { Configuration } from "@config";
import os from "os";
import { provider, setIgnoreEndpoints } from "./instrumentation";
import { container } from "@app-inversify";
import { CompressionAlgorithm } from "@opentelemetry/otlp-exporter-base";

export const registerTracer = (config: Configuration) => {
	provider.resource.attributes[SemanticResourceAttributes.SERVICE_NAME] =
		config.SERVICE_NAME;
	provider.resource.attributes[SemanticResourceAttributes.OS_NAME] =
		os.platform();
	provider.resource.attributes[SemanticResourceAttributes.HOST_NAME] =
		os.hostname();
	setIgnoreEndpoints(config.LOG_SERVER, config.TELEMETRY_ENDPOINT);
	const collectorOptions = {
		url: config.TELEMETRY_ENDPOINT,
		concurrencyLimit: 10, // an optional limit on pending requests
		hostname: config.SERVICE_NAME,
		compression: CompressionAlgorithm.GZIP,
	};
	const exporter = new OTLPTraceExporter(collectorOptions);
	container.bind(OTLPTraceExporter).toConstantValue(exporter);
	provider.addSpanProcessor(new BatchSpanProcessor(exporter));
	provider.register();
	["SIGINT", "SIGTERM"].forEach((signal) => {
		process.on(signal, () => provider.shutdown().catch(console.error));
	});
};

export const getTracer = (name: string): Tracer => {
	return trace.getTracer(name);
};
