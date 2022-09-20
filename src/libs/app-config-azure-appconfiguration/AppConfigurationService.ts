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
import {
	AzureCliCredential,
	ChainedTokenCredential,
	ManagedIdentityCredential,
	EnvironmentCredential,
} from "@azure/identity";
import {
	SecretClient,
	parseKeyVaultSecretIdentifier,
} from "@azure/keyvault-secrets";
import { KeyValue } from "@app-config";

export type AppConfigurationConfig = {
	connectionString: string;
};
export class AppConfigurationService {
	private keyVaults: Map<string, SecretClient> = new Map();
	private _appConfigClient: AppConfigurationClient;
	private _credential: ChainedTokenCredential;
	constructor(connectionString: string) {
		this._credential = new ChainedTokenCredential(
			new ManagedIdentityCredential(),
			new AzureCliCredential(),
			new EnvironmentCredential()
		);
		this._appConfigClient = new AppConfigurationClient(
			connectionString,
			this._credential
		);
	}

	public async List(
		filter: ListConfigurationSettingsOptions
	): Promise<KeyValue> {
		const listConfig = this._appConfigClient.listConfigurationSettings(filter);
		const configs = {};
		try {
			for await (const setting of listConfig) {
				const [newKey, value] = await this.ParserConfig(setting);
				configs[newKey] = value;
			}
		} catch (error) {
			console.log(error);
		}
		return configs;
	}
	private async ParseKeyVaultSecret(
		setting: ConfigurationSetting<string>
	): Promise<[string, string | undefined | FeatureFlagValue]> {
		const parsedSecretReference = parseSecretReference(setting);
		const { name: secretName, vaultUrl } = parseKeyVaultSecretIdentifier(
			parsedSecretReference.value.secretId
		);
		const client: SecretClient =
			this.keyVaults[vaultUrl] ??
			(this.keyVaults[vaultUrl] = new SecretClient(vaultUrl, this._credential));
		try {
			const secret = await client.getSecret(secretName);
			return [parsedSecretReference.key, secret.value];
		} catch (err: any) {
			const error = err as { code: string; statusCode: number };
			if (error.code === "SecretNotFound" && error.statusCode === 404) {
				throw new Error(
					`\n Secret is not found, make sure the secret ${parsedSecretReference.value.secretId} is present in your keyvault account;\n Original error - ${error}`
				);
			} else {
				throw err;
			}
		}
	}
	private async ParserConfig(
		setting: ConfigurationSetting<string>
	): Promise<
		[
			string,
			string | undefined | FeatureFlagValue | ConfigurationSetting<string>
		]
	> {
		switch (setting.contentType) {
			case secretReferenceContentType: {
				return this.ParseKeyVaultSecret(setting);
			}
			case featureFlagContentType: {
				const flag = parseFeatureFlag(setting);
				return [flag.value.id || flag.key, setting.value];
			}
			default:
				return [setting.key, setting.value];
		}
	}
	static New(config: Partial<AppConfigurationConfig>) {
		if (!config.connectionString)
			throw new Error("APP CONFIGURATION CONNECTION STRING IS REQUIRED.");

		return new AppConfigurationService(config.connectionString);
	}
}
