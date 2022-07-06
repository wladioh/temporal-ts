import { Container, decorate, injectable } from "inversify";
import { buildProviderModule } from "inversify-binding-decorators";
import { Controller } from "tsoa";
import { Configuration } from "@config";
import { TYPES } from "@utils/TYPES";
import { registerTracer } from "@utils/tracer/tracer";
import { ApiContainerModule, CoreContainerModule } from "@ioc";
import { ContextManager } from "@app-context-manager";
import { Api } from "@http-client";
import { Connection, WorkflowClient } from "@temporalio/client";
import { Runtime, DefaultLogger, LogLevel } from "@temporalio/worker";
import { OpenTelemetryWorkflowClientCallsInterceptor } from "@temporalio/interceptors-opentelemetry/lib/client";
import { LoggerFactory } from "@app-inversify";

export const ConfigureServices = async (
	container: Container
): Promise<void> => {
	ContextManager.Init();

	const config = container.get<Configuration>(TYPES.Configuration);
	registerTracer(config);
	decorate(injectable(), Controller); // Makes tsoa's Controller injectable
	const workerLogger = container.get<LoggerFactory>(TYPES.LoggerFactory)(
		"WORKER"
	);
	Runtime.install({
		logger: new DefaultLogger(
			<LogLevel>config.LOG_LEVEL.toString().toUpperCase(),
			(entry) => {
				const func = workerLogger[entry.level.toLowerCase()];
				if (func) func(entry.message, entry.meta);
			}
		),
	});

	const connection = new Connection({
		address: config.TEMPORAL_ADDRESS,
		// // Connect to localhost with default ConnectionOptions.
		// // In production, pass options to the Connection constructor to configure TLS and other settings:
		// address: 'foo.bar.tmprl.cloud', // as provisioned
		// tls: {} // as provisioned
	});
	const client = new WorkflowClient(connection.service, {
		// namespace: 'default', // change if you have a different namespace
		interceptors: {
			calls: [() => new OpenTelemetryWorkflowClientCallsInterceptor()],
		},
	});
	container.bind<WorkflowClient>(WorkflowClient).toConstantValue(client);

	await container.loadAsync(
		CoreContainerModule(),
		ApiContainerModule("SERVICE_API", config.SERVICE_API, Api)
	);
	// make inversify aware of inversify-binding-decorators
	container.load(buildProviderModule());
};
