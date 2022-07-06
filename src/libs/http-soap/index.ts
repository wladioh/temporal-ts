import { ILogger } from "@app-api/LoggerApi";
import { LoggerInterceptor } from "@http-client";
import { CreateResiliencyConfig } from "@http-resiliency";
import axios from "axios";
import { PolicyConfig } from "libs/http-resiliency/DefaultConfig";
import { Client, createClientAsync, IOptions } from "soap";
import { PartialDeep } from "type-fest";

export type ClientSoap<T> = Client & {
	[K in keyof T]: T[K];
};
export interface InterceptorSoap {
	OnSuccess(data: any): any;
	OnError(data: any): any;
}
export class ClientSoapBuilder {
	private url: string;
	private options?: IOptions;
	private interceptors: InterceptorSoap[] = [];
	private config?: PartialDeep<PolicyConfig>;
	private logger: ILogger;
	private constructor() {}

	private *getWslMethods(client: Client): Iterable<string> {
		const definitions = client.wsdl.definitions;
		const services = definitions.services;
		for (const name in services) {
			const ports = services[name].ports;
			for (const name in ports) {
				const binding = ports[name].binding;
				const methods = binding.methods;
				for (const name in methods) {
					yield name;
				}
			}
		}
	}
	private async addProxy(client: Client): Promise<void> {
		for await (const name of this.getWslMethods(client)) {
			client[name] = new Proxy(client[name], {
				apply: ((target, thisArg, args) => {
					const originalCallBack = args[1];
					args[1] = (err, result, ...others) => {
						if (err) {
							this.interceptors.forEach((it) => (err = it.OnError(err)));
						} else {
							this.interceptors.forEach(
								(it) => (result = it.OnSuccess(result))
							);
						}
						originalCallBack(err, result, ...others);
					};
					return target(...args);
				}).bind(this),
			});
			client[name + "Async"] = new Proxy(client[name + "Async"], {
				apply: ((target, _thisArg, args) => {
					return target(...args)
						.then((response) => {
							this.interceptors.forEach(
								(it) => (response = it.OnSuccess(response))
							);
							return response;
						})
						.catch((error) => {
							this.interceptors.forEach((it) => (error = it.OnError(error)));
							return error;
						});
				}).bind(this),
			});
		}
	}
	public async Build<T>(): Promise<T> {
		const resiliencyConfig = CreateResiliencyConfig(this.logger, {
			resiliency: this.config,
		});
		const axiosInstance = axios.create(resiliencyConfig);
		new LoggerInterceptor(this.logger).register(axiosInstance);
		const config = Object.assign({}, this.options, {
			request: <any>axiosInstance,
		});
		const client = await createClientAsync(this.url, config);
		await this.addProxy(client);

		return <any>client;
	}
	public ForUrl(url: string): ClientSoapBuilder {
		this.url = url;
		return this;
	}
	public WithOptions(options: IOptions): ClientSoapBuilder {
		this.options = options;
		return this;
	}
	public WithLogger(logger: ILogger): ClientSoapBuilder {
		this.logger = logger;
		return this;
	}
	public WithResiliency(config: PartialDeep<PolicyConfig>): ClientSoapBuilder {
		this.config = config;
		return this;
	}
	public WithInterceptors(
		...interceptors: InterceptorSoap[]
	): ClientSoapBuilder {
		this.interceptors.push(...interceptors);
		return this;
	}
	public static New(): ClientSoapBuilder {
		return new ClientSoapBuilder();
	}
}
