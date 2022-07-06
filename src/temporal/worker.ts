import { Configuration } from "@config";
import { Worker, NativeConnection, InjectedSinks } from "@temporalio/worker";
import * as activities from "./activities";
import { ActivityInboundLogInterceptor } from "./helpers";
import {
	OpenTelemetryActivityInboundInterceptor,
	makeWorkflowExporter,
} from "@temporalio/interceptors-opentelemetry/lib/worker";
import { container, LoggerFactory } from "@app-inversify";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { getLogger, LoggerSinks } from "./helpers/sinks";
import { Context } from "@temporalio/activity";

export async function TemporalWorkerStart(
	config: Configuration,
	loggerFactory: LoggerFactory
) {
	const connection = await NativeConnection.create({
		address: config.TEMPORAL_ADDRESS,
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
			(ctx: Context) => new ActivityInboundLogInterceptor(ctx, loggerFactory),
			(ctx: Context) => new OpenTelemetryActivityInboundInterceptor(ctx),
		],
		workflowModules: [require.resolve("./workflows")],
	};
	const worker = await Worker.create({
		connection: connection,
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
