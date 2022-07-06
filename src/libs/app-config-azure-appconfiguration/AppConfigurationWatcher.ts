import { ListConfigurationSettingsOptions } from "@azure/app-configuration";
import { AppConfigurationService } from "./AppConfigurationService";
import { IWatcherStrategy, KeyValue } from "@app-config";
import { ServiceBusClient } from "@azure/service-bus";
export type AppConfigurationWatcherServiceBus = {
	service: AppConfigurationService;
	connectionString: string;
	filter: ListConfigurationSettingsOptions;
	topicName: string;
	subscriptionName: string;
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
		const serviceBusClient = new ServiceBusClient(configs.connectionString);

		const watcher = new AppConfigurationWatcher(
			configs.service,
			configs.filter
		);
		const receiver = serviceBusClient.createReceiver(configs.topicName);
		const myMessageHandler = async (messageReceived) => {
			const { key, label } = messageReceived.body.data;
			watcher.OnChange(key, label);
		};

		// function to handle any errors
		const myErrorHandler = async (error) => {
			console.log(error);
		};

		// subscribe and specify the message and error handlers
		receiver.subscribe({
			processMessage: myMessageHandler,
			processError: myErrorHandler,
		});
		return watcher;
	}
}
