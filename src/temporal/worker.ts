import { Configuration } from "@config";
import { Worker, NativeConnection, InjectedSinks } from "@temporalio/worker";
import * as activities from "./activities";
import { ActivityInboundLogInterceptor } from "./helpers";
import {
	OpenTelemetryActivityInboundInterceptor,
	makeWorkflowExporter,
} from "@temporalio/interceptors-opentelemetry/lib/worker";
import { LoggerFactory, TYPES } from "@app-inversify";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { getLogger, LoggerSinks } from "./helpers/sinks";
import { Context } from "@temporalio/activity";
import { Container } from "inversify";
import { getDataConverter } from "./converters/crypto";

export async function TemporalWorkerStart(
	config: Configuration,
	container: Container
) {
	const loggerFactory = container.get<LoggerFactory>(TYPES.LoggerFactory);

	const connection = await NativeConnection.connect({
		address: config.TEMPORAL_ADDRESS,
		// tls: {
		// 	// set to true if TLS without mTLS
		// 	// See docs for other TLS options
		// 	clientCertPair: {
		// 		crt: clientCert,
		// 		key: clientKey,
		// 	},
		// },
	});
	const resource = new Resource({
		[SemanticResourceAttributes.SERVICE_NAME]: config.SERVICE_NAME,
	});
	const exporter = container.get<OTLPTraceExporter>(OTLPTraceExporter);
	const sinks: InjectedSinks<LoggerSinks> = {
		exporter: makeWorkflowExporter(exporter, <any>resource),
		logger: getLogger(loggerFactory),
	};
	const interceptors = {
		// workflowModules: [require.resolve("./workflows")],
		activityInbound: [
			(ctx: Context) =>
				new ActivityInboundLogInterceptor(ctx, loggerFactory, container),
			(ctx: Context) => new OpenTelemetryActivityInboundInterceptor(ctx),
		],
		workflowModules: [require.resolve("./workflows")],
	};
	const worker = await Worker.create({
		connection: connection,
		dataConverter: await getDataConverter(),
		workflowsPath: require.resolve("./workflows"), // passed to Webpack for bundling
		activities,
		taskQueue: "tutorial",
		debugMode: true,
		interceptors,
		enableSDKTracing: false,
		sinks: sinks,
	});
	await worker.run();
}
