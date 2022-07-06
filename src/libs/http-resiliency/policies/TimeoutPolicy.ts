import { ILogger } from "@app-api/LoggerApi";
import { Policy, TimeoutStrategy } from "cockatiel";
export interface TimeoutConfig {
	globalDuration: number;
	requestDuration: number;
}

export const timeoutPolicy = (config: TimeoutConfig, logger: ILogger) => {
	const timeout = Policy.timeout(
		config.globalDuration,
		TimeoutStrategy.Cooperative
	);

	timeout.onTimeout(() => {
		logger.warn("Request Timeout after %s.", config.globalDuration);
	});
	return timeout;
};
