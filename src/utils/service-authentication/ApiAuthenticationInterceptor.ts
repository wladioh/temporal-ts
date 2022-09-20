import { AxiosRequestConfig } from "axios";
import { AuthInterceptor, IAuthorizationStrategy } from "@http-client";
import { Configuration } from "@config";

export class ApiAuthenticationInterceptor extends AuthInterceptor {
	constructor(
		strategy: IAuthorizationStrategy,
		private configuration: Configuration
	) {
		super(strategy);
	}

	public InjectToken(axiosConfig: AxiosRequestConfig, token: string): void {
		axiosConfig.headers = axiosConfig.headers ?? {};
		axiosConfig.headers["x-custom-header-token"] = token;
		axiosConfig.headers["x-api-key"] = this.configuration.API_KEY;
	}
}
