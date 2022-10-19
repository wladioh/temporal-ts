import { AxiosError, AxiosInstance } from "axios";
import { IAuthorizationStrategy } from "@http-client";
import { Configuration } from "@config";
import { config, logger } from "@app-inversify";
import { ILogger } from "@app-log";
import Semaphore from "semaphore-async-await";

export class ApiAuthenticationStrategy implements IAuthorizationStrategy {
	private token = "";
	private lock: Semaphore = new Semaphore(1);
	constructor(
		@config() private config: Configuration,
		@logger()
		private readonly logger: ILogger
	) {}

	async getToken(api: AxiosInstance): Promise<string> {
		const currentToken = this.token;
		await this.lock.acquire();
		try {
			if (currentToken != this.token) {
				return this.token;
			}
			this.logger.info("requesting oaf token");
			const response = await api.post(
				"",
				{
					value: "SAME BODY TO AUTHENTICATION",
				},
				{
					cache: {
						cacheIf: () => false,
					},
					anonymous: true,
				}
			);
			this.token = `Bearer ${response.data.IdToken}`;
			this.logger.info("oaf token created");
			return this.token;
		} finally {
			this.lock.release();
		}
	}

	async refreshToken(api: AxiosInstance): Promise<void> {
		await this.getToken(api);
	}

	isNecessaryRenewToken(
		api: AxiosInstance,
		error: AxiosError<any, any>
	): boolean {
		const status = Number(error.response?.status).valueOf();
		return [401, 403].indexOf(status) >= 0;
	}
}
