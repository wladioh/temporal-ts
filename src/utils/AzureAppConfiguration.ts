import { PromiseProvider } from "@app-config";
import {
	AppConfigurationProvider,
	AppConfigurationService,
	AppConfigurationWatcher,
} from "@app-config-azure-appconfiguration";
import { container } from "@app-inversify";
import { Configuration } from "@config";

export const AppProvider: PromiseProvider<Configuration> = (
	config: Partial<Configuration>
) => {
	const service = AppConfigurationService.New({
		connectionString: config.APP_CONFIG_CONNECTION_STRING,
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

export const AppWatcher = (config: Partial<Configuration>) => {
	const service = container.get<AppConfigurationService>(
		AppConfigurationService
	);
	const watcher = AppConfigurationWatcher.WithAzureServiceBus({
		service,
		connectionString: config.EVENT_HUB_ENDPOINT || "",
		filter: {
			keyFilter: "*",
			labelFilter: `${config.SERVICE_NAME},DEFAULTS`,
		},
		eventHubName: config.EVENT_HUB_NAME || "",
		consumerGroup: config.EVENT_HUB_CONSUMER_GROUP || "",
	});
	return Promise.resolve(watcher);
};
