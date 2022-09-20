import {
	AppConfigDataClient,
	GetLatestConfigurationCommand,
} from "@aws-sdk/client-appconfigdata";

import { IConfigurationProvider, KeyValue } from "@app-config";

export class AWSAppConfigProvider implements IConfigurationProvider {
	constructor(private service: AppConfigDataClient) {}

	async Load(): Promise<KeyValue> {
		try {
			const command = new GetLatestConfigurationCommand({
				ConfigurationToken: undefined,
			});
			const result = await this.service.send(command);

			const configs = result.Configuration?.toString();
			if (configs) return JSON.parse(configs);
			// process data.
		} catch (error) {
			// error handling.
		} finally {
			// finally.
		}
		return {};
	}

	static New(appService: AppConfigDataClient): AWSAppConfigProvider {
		return new AWSAppConfigProvider(appService);
	}
}
