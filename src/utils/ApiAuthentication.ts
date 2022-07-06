import { AxiosError, AxiosInstance } from "axios";
import { IAuthorizationStrategy } from "@http-client";

export class ApiAuthentication implements IAuthorizationStrategy {
	private token = "-";
	getToken(api: AxiosInstance): Promise<string> {
		return Promise.resolve(this.token);
	}
	refreshToken(api: AxiosInstance): Promise<void> {
		this.token = "secret_token";
		return Promise.resolve();
	}
	isNecessaryRenewToken(
		api: AxiosInstance,
		error: AxiosError<any, any>
	): boolean {
		const status = Number(error.response?.status).valueOf();
		return [401, 403].indexOf(status) >= 0;
	}
}
