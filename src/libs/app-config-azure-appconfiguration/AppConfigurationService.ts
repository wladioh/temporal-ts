import {
	AppConfigurationClient,
	ConfigurationSetting,
	featureFlagContentType,
	FeatureFlagValue,
	ListConfigurationSettingsOptions,
	parseFeatureFlag,
	parseSecretReference,
	secretReferenceContentType,
} from "@azure/app-configuration";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { KeyValue } from "@app-config";
export type AppConfigurationConfig = {
	conectionString: string;
	keyVaultUri: string;
};
export class AppConfigurationService {
	constructor(
		private _appConfigClient: AppConfigurationClient,
		private secretClient?: SecretClient
	) {}

	public async List(
		filter: ListConfigurationSettingsOptions
	): Promise<KeyValue> {
		const listConfig = this._appConfigClient.listConfigurationSettings(filter);
		const configs = {};
		for await (const setting of listConfig) {
			const [newKey, value] = await this.ParserConfig(setting);
			configs[newKey] = value;
		}
		return configs;
	}

	private async ParserConfig(
		setting: ConfigurationSetting<string>
	): Promise<[string, string | undefined | FeatureFlagValue]> {
		switch (setting.contentType) {
			case secretReferenceContentType:
				if (this.secretClient) {
					const parsedSecretReference = parseSecretReference(setting);
					const key = parsedSecretReference.value.secretId.replace(
						`${this.secretClient.vaultUrl}secrets/`,
						""
					);
					const secret = await this.secretClient.getSecret(key);
					return [parsedSecretReference.key, secret.value];
				}
				return [setting.key, undefined];
			case featureFlagContentType:
				const flag = parseFeatureFlag(setting);
				return [flag.value.id || flag.key, flag.value];
			default:
				return [setting.key, setting.value];
		}
	}
	static New(config: Partial<AppConfigurationConfig>) {
		if (!config.conectionString)
			throw new Error("APP CONFIGURATION CONNECTION STRING IS REQUIRED.");
		const client = new AppConfigurationClient(config.conectionString);
		let secretClient: SecretClient | undefined;
		if (config.keyVaultUri) {
			const credential = new DefaultAzureCredential();
			secretClient = new SecretClient(config.keyVaultUri, credential);
		}
		return new AppConfigurationService(client, secretClient);
	}
}
