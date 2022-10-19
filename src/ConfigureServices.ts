import { Connection, WorkflowClient } from "@temporalio/client";
import { Runtime, DefaultLogger, LogLevel } from "@temporalio/worker";
import { OpenTelemetryWorkflowClientCallsInterceptor } from "@temporalio/interceptors-opentelemetry/lib/client";
import { LoggerFactory } from "@app-inversify";
import { Container, decorate, injectable } from "inversify";
import { buildProviderModule } from "inversify-binding-decorators";
import { Controller } from "tsoa";
import { Configuration } from "@config";
import { TYPES } from "@utils/TYPES";
import { registerTracer } from "@utils/tracer/tracer";
import "@services/AuthService";
import {
	ApiContainerModule,
	CoreContainerModule,
} from "./IoC/ContainerModules/GenericApiContainerModule";
import { ContextManager } from "@app-context-manager";
import { getDataConverter } from "@temporal/converters/crypto";

export const ConfigureServices = async (
	container: Container
): Promise<void> => {
	ContextManager.Init();
	const config = container.get<Configuration>(TYPES.Configuration);
	registerTracer(config);
	decorate(injectable(), Controller); // Makes tsoa's Controller injectable
	container.load(buildProviderModule());
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
	const connection = await Connection.connect({
		address: config.TEMPORAL_ADDRESS,
		// // Connect to localhost with default ConnectionOptions.
		// // In production, pass options to the Connection constructor to configure TLS and other settings:
		// tls: {} // as provisioned
		tls: {},
	});
	const client = new WorkflowClient({
		connection,
		// namespace: 'default', // change if you have a different namespace
		interceptors: {
			calls: [() => new OpenTelemetryWorkflowClientCallsInterceptor()],
		},

		dataConverter: await getDataConverter(),
	});
	container.bind<WorkflowClient>(WorkflowClient).toConstantValue(client);

	await container.loadAsync(
		CoreContainerModule()
		// ApiContainerModule(
		// 	TYPES.CHARACTERS_API,
		// 	`${config.API_GATEWAY_URL}/character-service`
		// )
	);
};
