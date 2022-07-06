import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { Policy, IPolicy } from "cockatiel";
import { PartialDeep } from "type-fest";
import lodash from "lodash";
import { ILogger } from "@app-api/LoggerApi";
import { circuitBreakerPolicy } from "./policies/CircuitBreakerPolicy";
import { retryPolicy } from "./policies/RetryPolicy";
import { timeoutPolicy } from "./policies/TimeoutPolicy";
import { CachePolicy, createCachePolicy } from "./policies/CachePolicy";
import { defaultConfig, PolicyConfig } from "./DefaultConfig";
import { BuildResiliencyAdpter } from "./AxiosAdapter";

export type AxiosResiliencyConfig = AxiosRequestConfig & {
	resiliency?: PartialDeep<PolicyConfig>;
	cachePolicy?: CachePolicy;
};

export const CreateResiliencyConfig = (
	logger: ILogger,
	config?: Partial<AxiosResiliencyConfig>
): AxiosResiliencyConfig => {
	const finalConfig: PolicyConfig = lodash.merge<any, any, any>(
		{},
		defaultConfig,
		config?.resiliency
	);
	const cachePolicy = createCachePolicy(finalConfig.cache);
	const policy = config?.policy || resiliencyPolicyBuild(logger, finalConfig);
	const adapter = BuildResiliencyAdpter(policy, cachePolicy);
	return {
		...config,
		adapter,
		timeout: finalConfig.timeout.requestDuration,
	};
};

const resiliencyPolicyBuild = (
	logger: ILogger,
	finalConfig: PolicyConfig
): IPolicy => {
	const handlerResults = Policy.handleWhenResult((it: AxiosResponse) =>
		finalConfig.handleWhenStatus.includes(it.status)
	).orWhen((err: AxiosError) => {
		return (
			err.code === "ECONNABORTED" ||
			finalConfig.handleWhenStatus.includes(err.response?.status || 0)
		);
	});

	const breaker = circuitBreakerPolicy(
		handlerResults,
		finalConfig.circuitBreaker,
		logger
	);
	const retry = retryPolicy(handlerResults, finalConfig.retry, logger);
	const timeout = timeoutPolicy(finalConfig.timeout, logger);

	const bulkhead = Policy.bulkhead(
		finalConfig.bulkhead.limitParalleRequest,
		finalConfig.bulkhead.queueSize
	);
	return Policy.wrap(timeout, retry, breaker, bulkhead);
};
