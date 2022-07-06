import { ILogger } from "@app-api/LoggerApi";
import {
	RedisClientType,
	RedisModules,
	RedisScripts,
	RedisFunctions,
	createClient,
} from "redis";
export type RedisConfig = {
	MAX_TIMEOUT_RECONNECT: number;
	MAX_RETRY_RECONNECT: number;
	URL: string;
	SSL: boolean;
	PREFIX: string;
	PASSWORD: string;
};

const Sleep = (timeout: number) =>
	new Promise<void>((resolve) => {
		setTimeout(resolve, timeout);
	});
export type RedisInstanceType = RedisClientType<
	RedisModules,
	RedisFunctions,
	RedisScripts
>;
export class RedisInstance {
	private static instance: RedisInstanceType | undefined;

	private static retryConnect(logger: ILogger, config: RedisConfig): any {
		return (retries: number): number | Error => {
			if (config.MAX_RETRY_RECONNECT > retries) {
				logger.error(
					"Maximum number of retries reached %s",
					config.MAX_RETRY_RECONNECT
				);
				return Error("Maximum number of retries reached");
			}
			logger.warn("Retring to connecto %s", retries);
			const maxTimeout = config.MAX_TIMEOUT_RECONNECT;
			const expTimeout = Math.pow(2, retries) * 100;
			return Math.min(expTimeout, maxTimeout);
		};
	}
	public static async connected(timeout: number): Promise<boolean> {
		if (!RedisInstance.instance) return false;
		try {
			Promise.race([RedisInstance.instance.connect(), Sleep(timeout)]);
			await RedisInstance.instance.ping();
			return true;
		} catch {
			return false;
		}
	}
	public static async createClient(
		logger: ILogger,
		config: RedisConfig
	): Promise<RedisInstanceType> {
		const client =
			RedisInstance.instance ||
			(this.instance = createClient({
				url: config.URL,
				//prefix: config.PREFIX,
				password: config.PASSWORD,
				//return_buffers: true,
				socket: {
					reconnectStrategy: RedisInstance.retryConnect(logger, config),
				},
			}));
		return client;
	}
}
