import { ICacheProvider } from "@app-api/ICacheProvider";
import { InMemoryCacheProvider } from "@app-cache-memory";
import { container, LoggerFactory } from "@app-inversify";
import { Configuration } from "@config";
import { Api, AuthInterceptor, LoggerInterceptor } from "@http-client";
import { CreateResiliencyConfig } from "@http-resiliency";
import { ApiAuthentication } from "@utils/ApiAuthentication";
import { TYPES } from "@utils/TYPES";
import { interfaces, AsyncContainerModule } from "inversify";
import { ServicesTokens } from "../tokens";

const resiliencyConfig = {
	cache: {
		duration: 60 * 60 * 1, // 1 hora de cache
	},
	timeout: {
		globalDuration: 5000,
		requestDuration: 2000,
	},
	retry: {
		attempts: 3,
	},
	circuitBreaker: {},
	bulkhead: {},
	fallback: {},
};

export const ApiContainerModule = (
	description: string,
	url: string,
	identifier: interfaces.ServiceIdentifier<Api>
): AsyncContainerModule => {
	return new AsyncContainerModule(async (bind: interfaces.Bind) => {
		const logManager = container.get<LoggerFactory>(TYPES.LoggerFactory);
		const cacheProvider = container.get<ICacheProvider>(ServicesTokens.Cache);
		const logger = logManager(description);
		const apiConfig = CreateResiliencyConfig(logger, {
			baseURL: url,
			validateStatus: (status: number) => status !== 401 && status !== 403,
			resiliency: {
				...resiliencyConfig,
				cache: { provider: cacheProvider },
			},
		});
		const auth = container.get<AuthInterceptor>(AuthInterceptor);
		const api = new Api(apiConfig, new LoggerInterceptor(logger), auth);
		bind<Api>(identifier).toConstantValue(api);
	});
};

export const CoreContainerModule = (): AsyncContainerModule => {
	return new AsyncContainerModule(async (bind: interfaces.Bind) => {
		const logger = container.get<LoggerFactory>(TYPES.LoggerFactory)(
			"AUTH-INTERCEPTOR"
		);
		const config = container.get<Configuration>(TYPES.Configuration);

		bind<AuthInterceptor>(AuthInterceptor).toConstantValue(
			new AuthInterceptor(new ApiAuthentication(), logger)
		);
		// TODO: UTILIZAR UM PROVEDOR DE CACHE REDIS const cacheProvider = new IoRedisCacheProvider();
		bind<ICacheProvider>(ServicesTokens.Cache).toConstantValue(
			new InMemoryCacheProvider()
		);
	});
};
