import { ICacheProvider } from "@app-api/ICacheProvider";
import { InMemoryCacheProvider } from "@app-cache-memory";
import { container, LoggerFactory } from "@app-inversify";
import { Configuration } from "@config";
import { Api, IInterceptor, LoggerInterceptor } from "@http-client";
import { CreateResiliencyConfig } from "@http-resiliency";
import { TYPES } from "@utils/TYPES";
import { interfaces, AsyncContainerModule } from "inversify";
import { ServicesTokens } from "../tokens";
import https from "https";
import { ApiAuthenticationInterceptor } from "@utils/service-authentication/ApiAuthenticationInterceptor";
import { ApiAuthenticationStrategy } from "@utils/service-authentication/ApiAuthenticationStrategy";

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
	identifier: symbol,
	url: string,
	...interceptors: Array<IInterceptor>
): AsyncContainerModule => {
	return new AsyncContainerModule(async (bind: interfaces.Bind) => {
		const config = container.get<Configuration>(TYPES.Configuration);
		const logManager = container.get<LoggerFactory>(TYPES.LoggerFactory);
		const cacheProvider = container.get<ICacheProvider>(ServicesTokens.Cache);
		const apilogger = logManager(
			identifier.description ?? identifier.toString()
		);
		const httpsAgent = new https.Agent({
			rejectUnauthorized: false,
		});
		let apiConfig: any = {
			baseURL: url,
			httpsAgent: httpsAgent,
			validateStatus: (status: number) => status !== 401 && status !== 403,
		};
		apiConfig = CreateResiliencyConfig(apilogger, {
			...apiConfig,
			resiliency: {
				...resiliencyConfig,
				cache: { provider: cacheProvider },
			},
		});

		const logger = logManager("API-AUTH-INTERCEPTOR");
		const authInterceptor = new ApiAuthenticationInterceptor(
			new ApiAuthenticationStrategy(config, logger),
			config
		);
		const api = new Api(
			apiConfig,
			new LoggerInterceptor(logger),
			authInterceptor,
			...interceptors
		);
		bind<Api>(identifier).toConstantValue(api);
	});
};

export const CoreContainerModule = (): AsyncContainerModule => {
	return new AsyncContainerModule(async (bind: interfaces.Bind) => {
		// TODO: UTILIZAR UM PROVEDOR DE CACHE REDIS const cacheProvider = new IoRedisCacheProvider();
		bind<ICacheProvider>(ServicesTokens.Cache).toConstantValue(
			new InMemoryCacheProvider()
		);
	});
};
