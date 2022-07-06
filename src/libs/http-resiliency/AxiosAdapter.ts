import { AxiosRequestConfig, AxiosResponse } from "axios";
import { createFallbackPolicy } from "./policies/FallbackPolicy";
import httpAdapter from "axios/lib/adapters/http";
import { defaultConfig, PolicyConfig } from "./DefaultConfig";
import { CachePolicy } from "./policies/CachePolicy";
import { IPolicy } from "cockatiel";

type Adpter = (c: AxiosRequestConfig) => Promise<any>;
export const BuildResiliencyAdpter = (
	p: IPolicy,
	cachePolicy: CachePolicy | undefined
): Adpter => {
	return (c: AxiosRequestConfig): Promise<any> => {
		const policy = createFallbackPolicy(
			c,
			defaultConfig.fallback,
			c.policy || p
		);
		if (cachePolicy) {
			return cachePolicy.execute(c, () =>
				policy.execute((): Promise<AxiosResponse> => httpAdapter(c))
			);
		} else {
			return policy.execute((): Promise<AxiosResponse> => httpAdapter(c));
		}
	};
};
