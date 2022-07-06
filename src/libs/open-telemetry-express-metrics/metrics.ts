import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import {
	MeterProvider,
	PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics-base";
import { Resource, ResourceAttributes } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { HostMetrics } from "@opentelemetry/host-metrics";
import { Request, Response } from "express";
import { Counter, Histogram } from "@opentelemetry/api-metrics";

export type ApdexConfiguration = {
	isFailureStatus: (status: number) => boolean;
	threshold: number;
};
export type MetricsConfiguration = {
	ENDPOINT: string;
	SERVICE_NAME: string;
	ENABLE_DIAGNOSTIC: boolean;
	APDEX: ApdexConfiguration;
};

const createProvider = (configuration: MetricsConfiguration) => {
	if (configuration.ENABLE_DIAGNOSTIC)
		diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
	const serviceName = configuration.SERVICE_NAME;
	const metricExporter = new OTLPMetricExporter({
		url: configuration.ENDPOINT,
		concurrencyLimit: 10, // an optional limit on pending requests
		hostname: serviceName,
	});
	const x: ResourceAttributes = {
		[SemanticResourceAttributes.SERVICE_NAME]: serviceName,
	};
	const meterProvider = new MeterProvider({
		resource: new Resource(x) as any,
	});

	meterProvider.addMetricReader(
		new PeriodicExportingMetricReader({
			exporter: metricExporter,
			exportIntervalMillis: 1000,
		})
	);
	// ["SIGINT", "SIGTERM"].forEach((signal) => {
	// 	process.on(signal, () => meterProvider.shutdown().catch(console.error));
	// });

	return meterProvider;
};

export class ExpressMetricsCollector {
	private requestCounter: Counter;
	private requestDuration: Histogram;
	private apdex: Histogram;
	private toleratedValue: number;
	constructor(
		private config: {
			meterProvider: MeterProvider;
			name: string;
			apdex: ApdexConfiguration;
		}
	) {}

	start(): void {
		this.toleratedValue = this.config.apdex.threshold * 4;
		const meter = this.config.meterProvider.getMeter(this.config.name);
		this.requestCounter = meter.createCounter("requests", {
			description: "Counter of requests",
		});

		this.requestDuration = meter.createHistogram("request_duration", {
			description: "Request duration 150, 200, 300",
		});
		this.apdex = meter.createHistogram("apdex", {
			description: "Apdex index",
		});
	}
	private calcApdex(statusCode: number, time: number) {
		const fail = this.config.apdex.isFailureStatus(statusCode);
		let level = "satisfied";
		level = fail || time > this.toleratedValue ? "frustrated" : level;
		level =
			!fail && time > this.config.apdex.threshold && time <= this.toleratedValue
				? "tolerated"
				: level;
		return {
			value: time / this.config.apdex.threshold,
			level,
		};
	}

	record(request: Request, response: Response, time: number) {
		const label = { status: response.statusCode.toString() };
		this.requestCounter.add(1, label);
		this.requestDuration.record(time, label);
		const apdex = this.calcApdex(response.statusCode, time);
		this.apdex.record(apdex.value, {
			level: apdex.level,
			endpoint: request.route?.path,
		});
	}
}
const apdexConfigDefault: ApdexConfiguration = {
	isFailureStatus: (status: number) => status >= 500 || status == 408,
	threshold: 300,
};

const defaultConfig: MetricsConfiguration = {
	SERVICE_NAME: "SERVICE",
	ENDPOINT: "http://localhost:55681",
	ENABLE_DIAGNOSTIC: false,
	APDEX: apdexConfigDefault,
};

export const registerMetrics = (
	configuration: Partial<MetricsConfiguration>
) => {
	const config: MetricsConfiguration = Object.assign(
		{},
		defaultConfig,
		configuration
	);
	const configApdex: ApdexConfiguration = Object.assign(
		{},
		apdexConfigDefault,
		configuration.APDEX
	);

	const serviceName = config.SERVICE_NAME;
	const meterProvider = createProvider(config);
	const httpMetrics = new ExpressMetricsCollector({
		meterProvider,
		name: serviceName,
		apdex: configApdex,
	});
	// const hostMetrics = new HostMetrics({
	// 	meterProvider: meterProvider,
	// 	name: serviceName,
	// });
	//hostMetrics.start();
	httpMetrics.start();
	return httpMetrics;
};
