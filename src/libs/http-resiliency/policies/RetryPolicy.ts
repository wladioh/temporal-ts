import { ILogger } from "@app-api/LoggerApi";
import { fullJitterGenerator, Policy } from "cockatiel";

export interface RetryConfig {
	attempts: number;
}

export const retryPolicy = (
	handlerResults: Policy,
	config: RetryConfig,
	logger: ILogger
) => {
	const retry = handlerResults.retry().attempts(config.attempts).exponential({
		generator: fullJitterGenerator,
	});
	retry.onGiveUp((data: any) => {
		logger.error(
			"REQ GIVEUP %s:%s %s",
			data.error?.config?.method?.toUpperCase(),
			data.error?.response?.status,
			data.error?.config?.url
		);
	});
	retry.onRetry((data: any) => {
		logger.warn(
			"RETRYING AFTER RESP END %s",
			data.error?.message || data.value?.status
		);
	});
	return retry;
};
