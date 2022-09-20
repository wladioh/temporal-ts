import { ListConfigurationSettingsOptions } from "@azure/app-configuration";
import { IConfigurationProvider, KeyValue } from "@app-config";
import { AppConfigurationService } from "./AppConfigurationService";

type AppConfigurationProviderConfig = {
	filter: ListConfigurationSettingsOptions;
};

export class AppConfigurationProvider implements IConfigurationProvider {
	constructor(
		private service: AppConfigurationService,
		private filter: ListConfigurationSettingsOptions
	) {}

	async Load(): Promise<KeyValue> {
		return this.service.List(this.filter);
	}
	static New(
		appService: AppConfigurationService,
		configs: AppConfigurationProviderConfig
	): AppConfigurationProvider {
		return new AppConfigurationProvider(appService, configs.filter);
	}
}
