import { TYPES } from "@app-inversify";

export const ServicesTokens = {
	...TYPES,
	Cache: Symbol.for("CACHE"),
	SERVICE_API: Symbol.for("SERVICE_API"),
};
