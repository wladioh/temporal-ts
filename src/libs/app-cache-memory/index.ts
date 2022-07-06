import { ICacheProvider } from "@app-api/ICacheProvider";
import NodeCache from "node-cache";

export class InMemoryCacheProvider implements ICacheProvider {
	cache: NodeCache;

	constructor() {
		this.cache = new NodeCache({ checkperiod: 10 });
	}

	add<T>(key: string, data: T, ttl: number): Promise<void> {
		this.cache.set(key, data, ttl);
		return Promise.resolve();
	}

	get<T>(key: string): Promise<T | undefined> {
		const value = this.cache.get<T>(key);
		return Promise.resolve(value);
	}

	delete(key: string): Promise<void> {
		this.cache.del(key);
		return Promise.resolve();
	}
}
