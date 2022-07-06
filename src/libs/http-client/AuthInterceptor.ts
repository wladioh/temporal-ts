import { ILogger } from "@app-api/LoggerApi";
import { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { IInterceptor } from "./IInterceptor";
import { IAuthorizationStrategy } from "./IAuthorizationStrategy";

export class AuthInterceptor implements IInterceptor {
	private api: AxiosInstance;
	private token: Promise<string> | undefined;
	private renewingToken: Promise<void> = Promise.resolve();
	constructor(
		private strategy: IAuthorizationStrategy,
		private logger: ILogger
	) {}

	register(axios: AxiosInstance): void {
		axios.interceptors.request.use(this.RequestInjectToken.bind(this));
		axios.interceptors.response.use(
			this.OnResponseFulfilled.bind(this),
			this.ResponseAuthError.bind(this)
		);
	}

	private async OnResponseFulfilled(response: AxiosRequestConfig) {
		return response;
	}

	private async RequestInjectToken(
		axiosConfig: AxiosRequestConfig
	): Promise<AxiosRequestConfig> {
		if (axiosConfig.anonymous) return axiosConfig;
		await this.renewingToken;
		const token = await (this.token ??
			(this.token = this.strategy.getToken(this.api)));
		if (!Boolean(token))
			this.logger.error("request is authenticated and token is undefined.");
		axiosConfig.headers = axiosConfig.headers ?? {};
		axiosConfig.headers.Authorization = token;
		return axiosConfig;
	}

	private async ResponseAuthError(error: AxiosError): Promise<unknown> {
		const status = error?.response?.status;
		const authenticating =
			error && error.config ? error.config["authenticating"] : false;
		if (
			!authenticating &&
			status &&
			this.strategy.isNecessaryRenewToken(this.api, error)
		) {
			error.config["authenticating"] = true;
			this.renewingToken = new Promise<void>(async (resolve) => {
				await this.strategy.refreshToken(this.api);
				this.token = undefined;
				resolve();
			});
			await this.renewingToken;
			return this.api.request(error.config);
		}

		return Promise.reject(error);
	}
}
