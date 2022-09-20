import { ListConfigurationSettingsOptions } from "@azure/app-configuration";
import { AppConfigurationService } from "./AppConfigurationService";
import { IWatcherStrategy, KeyValue } from "@app-config";
import { EventHubConsumerClient } from "@azure/event-hubs";

import {
	AzureCliCredential,
	ChainedTokenCredential,
	ManagedIdentityCredential,
	EnvironmentCredential,
} from "@azure/identity";
export type AppConfigurationWatcherServiceBus = {
	service: AppConfigurationService;
	connectionString: string;
	filter: ListConfigurationSettingsOptions;
	eventHubName: string;
	consumerGroup: string;
};
export class AppConfigurationWatcher implements IWatcherStrategy {
	private valuesCallback?: (values: KeyValue) => void;
	constructor(
		private appConfigurationService: AppConfigurationService,
		private filter: ListConfigurationSettingsOptions
	) {}

	async OnChange(key: string, label: string) {
		const configs = await this.appConfigurationService.List({
			...this.filter,
			keyFilter: key,
		});
		if (Object.keys(configs).length > 0 && this.valuesCallback)
			this.valuesCallback(configs);
	}

	async Watch(valuesCallback: (values: KeyValue) => void): Promise<void> {
		this.valuesCallback = valuesCallback;
	}

	static WithAzureServiceBus(configs: AppConfigurationWatcherServiceBus) {
		const credential = new ChainedTokenCredential(
			new ManagedIdentityCredential(),
			new AzureCliCredential(),
			new EnvironmentCredential()
		);
		const watcher = new AppConfigurationWatcher(
			configs.service,
			configs.filter
		);
		const consumerClient = new EventHubConsumerClient(
			configs.consumerGroup,
			configs.connectionString,
			configs.eventHubName,
			credential
		);

		consumerClient.subscribe({
			processEvents: async (events, context) => {
				// event processing code goes here
				if (events.length > 0) {
					events.forEach((element) => {
						const { key, label } = element.body[0].data;
						watcher.OnChange(key, label);
					});
				}
			},
			processError: async (error, context) => {
				// error reporting/handling code here
				console.log(error);
			},
		});
		return watcher;
	}
}
