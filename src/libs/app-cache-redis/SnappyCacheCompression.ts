import { compress, uncompress } from "snappy";
import { ICacheCompression } from "./CacheService";

export class SnappyCacheCompression implements ICacheCompression {
	compress(data: string | Buffer): Promise<Buffer> {
		return compress(data);
	}
	uncompress(data: string | Buffer): Promise<Buffer | string> {
		return uncompress(data);
	}
}

export class DummyCompression implements ICacheCompression {
	compress(data: string | Buffer): Promise<Buffer | string> {
		return Promise.resolve(data);
	}
	uncompress(data: string | Buffer): Promise<Buffer | string> {
		return Promise.resolve(data);
	}
}
