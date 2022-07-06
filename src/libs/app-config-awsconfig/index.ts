import {
	AppConfigClient,
	GetConfigurationCommand,
} from "@aws-sdk/client-appconfig";
import { IConfigurationProvider, KeyValue } from "@app-config";

export class AWSAppConfigProvider implements IConfigurationProvider {
	constructor(private service: AppConfigClient) {}

	async Load(): Promise<KeyValue> {
		const command = new GetConfigurationCommand({
			Application: "",
			Environment: "",
			ClientId: "",
			Configuration: "",
		});

		const result = await this.service.send(command);
		const content = new TextDecoder().decode(result.Content);
		return JSON.parse(content);
	}

	static New(appService: AppConfigClient): AWSAppConfigProvider {
		return new AWSAppConfigProvider(appService);
	}
}
