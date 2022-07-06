import { AxiosInstance } from "axios";
import { Api } from "./Api";

export interface IInterceptor {
	register(axios: AxiosInstance): void;
}
