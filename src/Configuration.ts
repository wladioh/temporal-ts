import Joi from "joi";
import {
	BuildSchema,
	UrlPattern,
	PromiseProvider,
	BaseConfiguration,
} from "@app-config";
import {
	AppConfigurationProvider,
	AppConfigurationService,
	AppConfigurationWatcher,
} from "@app-config-azure-appconfiguration";
import { FeatureFlagValue } from "@azure/app-configuration";
import { container } from "@app-inversify";

export type Configuration = BaseConfiguration & {
	SERVER_PORT: number;
	MANAGEMENT_PORT: number;
	SERVICE_API: string;
	LOG_SERVER: string;
	TELEMETRY_ENDPOINT: string;
	TESTE_FEATURE: FeatureFlagValue | undefined;
	APP_CONFIG_CONNECTION_STRING: string;
	SERVICE_BUS_CONNECTION_STRING: string;
	SOAP_SERVICE_URL: string;
	FAIL_INJECTION_RATE: number;
	SOAP_URL: string;
	TEMPORAL_ADDRESS: string;
};

export const ConfigurationSchema = BuildSchema<Configuration>({
	SERVER_PORT: Joi.number().default(8080),
	MANAGEMENT_PORT: Joi.number().default(8081),
	SERVICE_NAME: Joi.string().required(),
	SERVICE_API: UrlPattern().required(),
	LOG_SERVER: UrlPattern().required(),
	TELEMETRY_ENDPOINT: UrlPattern().required(),
	SOAP_SERVICE_URL: UrlPattern().required(),
	TESTE_FEATURE: Joi.object(),
	FAIL_INJECTION_RATE: Joi.number().default(0.2),
	TEMPORAL_ADDRESS: Joi.string().required(),
});

const AppProvider: PromiseProvider<Configuration> = (
	config: Partial<Configuration>
) => {
	const service = AppConfigurationService.New({
		conectionString: config.APP_CONFIG_CONNECTION_STRING,
		keyVaultUri: undefined,
	});
	container
		.bind<AppConfigurationService>(AppConfigurationService)
		.toConstantValue(service);
	const provider = AppConfigurationProvider.New(service, {
		filter: {
			keyFilter: "*",
			labelFilter: config.SERVICE_NAME,
		},
	});
	return Promise.resolve(provider);
};

const AppWatcher = (config: Partial<Configuration>) => {
	const service = container.get<AppConfigurationService>(
		AppConfigurationService
	);
	const watcher = AppConfigurationWatcher.WithAzureServiceBus({
		service,
		connectionString: config.SERVICE_BUS_CONNECTION_STRING || "",
		filter: {
			keyFilter: "*",
			labelFilter: config.SERVICE_NAME,
		},
		topicName: "teste",
		subscriptionName: "",
	});
	return Promise.resolve(watcher);
};
