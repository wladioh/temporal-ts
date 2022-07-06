import { IPolicy, Policy } from "cockatiel";
import { RedisInstance, RedisInstanceType } from "./RedisInstance";
import { ICacheProvider } from "@app-api/ICacheProvider";
import { ILogger } from "@app-api/LoggerApi";

export interface ICacheCompression {
	compress(data: string | Buffer): Promise<Buffer | string>;
	uncompress(data: string | Buffer): Promise<Buffer | string>;
}

export class RedisCacheProvider implements ICacheProvider {
	private policy: IPolicy;
	constructor(
		private client: RedisInstanceType,
		private logger: ILogger,
		private compression: ICacheCompression,
		policy?: IPolicy
	) {
		this.policy = policy ?? Policy.noop;
		this.client.on("connect", () => {
			logger.info("Redis connected with success.");
		});
		this.client.on("error", (error) => {
			logger.error(
				"Encountering an error connecting to the Redis server. Error %s",
				error
			);
		});
		this.client.on("reconnecting", (error) => {
			logger.info(
				"Attempt %s to reconnect after %s milliseconds.",
				error.attempt,
				error.delay
			);
		});
	}

	async waitConnect(timeout: number): Promise<boolean> {
		return RedisInstance.connected(timeout);
	}

	public async add<T>(key: string, data: T, duration?: number): Promise<void> {
		if (!this.client.isOpen) return undefined;
		try {
			const valueCompressed = await this.compression.uncompress(
				JSON.stringify(data)
			);
			await this.policy.execute(() =>
				this.client.set(key, valueCompressed, {
					EX: duration,
				})
			);
			this.logger.debug(
				"Creating cache for key: [%s] ttl: [%s].",
				key,
				duration
			);
		} catch (error) {
			this.logger.error(
				"Error on SET value to Redis, KEY: [%s] ERROR %s",
				key,
				error
			);
		}
	}

	public async get<T>(key: string): Promise<T | undefined> {
		if (!this.client.isOpen) return undefined;
		try {
			const cache = await this.policy.execute(() => this.client.get(key));
			if (cache) {
				const valueCompressed = await this.compression.compress(cache);
				this.logger.debug("Using cached response for key: [%s]", key);
				return JSON.parse(valueCompressed.toString());
			}
			this.logger.debug("Value not found for key: [%s].", key);
		} catch (e) {
			this.logger.warn(
				"Error when trying to get key:[%s]; message=%s",
				key,
				e.message
			);
		}
		return undefined;
	}

	public async delete(key: string): Promise<void> {
		if (!this.client.isOpen) return;
		try {
			await this.policy.execute(() => this.deleteMany(key));
			this.logger.info("Deleted key [%s]", key);
		} catch (error) {
			this.logger.error(
				"Error on DEL value to Redis, KEY: [%s] ERROR %s",
				key,
				error
			);
		}
	}

	private async toArray<T>(asyncIterator: AsyncIterable<T>) {
		const arr: T[] = [];
		for await (const i of asyncIterator) arr.push(i);
		return arr;
	}

	public async deleteMany(match: string) {
		const keys = this.client.scanIterator({ MATCH: match });
		const arr = await this.toArray(keys);
		this.client.unlink(arr);
	}

	public async dispose(): Promise<void> {
		await this.client.flushAll();
	}
}
