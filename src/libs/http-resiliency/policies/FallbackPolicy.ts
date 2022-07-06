import { AxiosRequestConfig, AxiosResponse } from "axios";
import {
	Policy,
	IPolicy,
	BrokenCircuitError,
	TaskCancelledError,
	BulkheadRejectedError,
	IsolatedCircuitError,
} from "cockatiel";
import lodash from "lodash";

export type FallbackOptions = {
	status?: Array<number>;
	data: Required<any>;
};

export type FallbackConfig = {
	data: any;
	status: Array<number>;
	whenResult: (response: AxiosResponse) => boolean;
};

export const createFallbackPolicy = (
	c: AxiosRequestConfig,
	defaultConfig: FallbackConfig,
	policy: IPolicy
): IPolicy => {
	const fallback: FallbackConfig = lodash.merge<FallbackConfig, any>(
		defaultConfig,
		c.fallback
	);
	if (fallback.data) {
		const fallbackResult: AxiosResponse = {
			data: fallback.data,
			status: 200,
			statusText: "200",
			config: c,
			isFallback: true,
			headers: {},
			request: c,
		};
		const fallbackPolicy = Policy.handleWhenResult((it: AxiosResponse) =>
			fallback.status.includes(it.status)
		)
			.orWhenResult(fallback.whenResult)
			.orType<BrokenCircuitError>(BrokenCircuitError)
			.orType<IsolatedCircuitError>(IsolatedCircuitError)
			.orType<TaskCancelledError>(TaskCancelledError)
			.orType<BulkheadRejectedError>(BulkheadRejectedError)
			.fallback(() => fallbackResult);

		if (policy) return Policy.wrap(fallbackPolicy, policy);
		return Policy.wrap(fallbackPolicy);
	}
	if (policy) return policy;
	return Policy.noop;
};
