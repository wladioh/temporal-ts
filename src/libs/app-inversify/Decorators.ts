import { TYPES } from "./TYPES";
import { inject } from "inversify";
import { fluentProvide } from "inversify-binding-decorators";
import { interfaces } from "inversify";

export function loggerFactory() {
	return (
		target: Object,
		propertyKey: string | symbol,
		parameterIndex: number
	) => {
		inject(TYPES.LoggerFactory)(target, propertyKey, parameterIndex);
	};
}

export function logger() {
	return (
		target: Object,
		propertyKey: string | symbol,
		parameterIndex: number
	) => {
		inject(TYPES.LOGGER)(target, propertyKey, parameterIndex);
	};
}

export function loggerAdapter() {
	return (
		target: Object,
		propertyKey: string | symbol,
		parameterIndex: number
	) => {
		inject(TYPES.LOGGER_ADAPTER)(target, propertyKey, parameterIndex);
	};
}

export function config() {
	return (
		target: Object,
		propertyKey: string | symbol,
		parameterIndex: number
	) => {
		inject(TYPES.Configuration)(target, propertyKey, parameterIndex);
	};
}

export const provideSingleton = function <T>(
	identifier: interfaces.ServiceIdentifier<T>
) {
	return fluentProvide(identifier).inSingletonScope().done();
};
