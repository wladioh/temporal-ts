import { LoggerManager } from "@app-log";
import { Configuration } from "@config";
import { Container, interfaces, AsyncContainerModule } from "inversify";
import { ClientSoapBuilder } from "@http-soap";
import { TYPES } from "@utils/TYPES";
import { ISoapService } from "@services/SoapService";
import { SoapHandlerResultInterceptor } from "@utils/SoapInterceptor";
import { ignoreCache } from "@utils/middlewares/contextFill";
import { ICacheProvider } from "@app-api/ICacheProvider";

export const SoapContainerModule = (
	container: Container
): AsyncContainerModule => {
	return new AsyncContainerModule(async (bind: interfaces.Bind) => {
		const config = container.get<Configuration>(TYPES.Configuration);
		const logManager = container.get<LoggerManager>(LoggerManager);
		const cache = container.get<ICacheProvider>(TYPES.Cache);
		const loggerSoap = logManager.Get("HTTP_SOAP_SERVICE");
		const client = await ClientSoapBuilder.New()
			.ForUrl(config.SOAP_SERVICE_URL)
			.WithLogger(loggerSoap)
			.WithResiliency({
				timeout: {
					globalDuration: 5000,
					requestDuration: 2000,
				},
				cache: {
					provider: cache,
					ignoreCache: ignoreCache,
				},
			})
			.WithInterceptors(new SoapHandlerResultInterceptor())
			.Build<ISoapService>();
		bind<ISoapService>(TYPES.SOAP_CLIENT).toConstantValue(client);
	});
};
