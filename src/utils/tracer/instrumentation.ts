import {
	SpanKind,
	SamplingDecision,
	Context,
	Attributes,
	Link,
	SamplingResult,
	Sampler,
} from "@opentelemetry/api";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { ExpressLayerType } from "@opentelemetry/instrumentation-express";
import { AlwaysOnSampler } from "@opentelemetry/core";
import {
	SemanticAttributes,
	SemanticResourceAttributes,
} from "@opentelemetry/semantic-conventions";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

type ignoreHealthCheck = (
	spanName: string,
	spanKind: SpanKind,
	attributes: Attributes
) => boolean;

const filterSampler = (
	ignoreHealthCheck: ignoreHealthCheck,
	loggerIgnore: ignoreHealthCheck,
	parent: Sampler
) => {
	return {
		shouldSample(
			context: Context,
			traceId: string,
			spanName: string,
			spanKind: SpanKind,
			attributes: Attributes,
			links: Link[]
		): SamplingResult {
			if (
				ignoreHealthCheck(spanName, spanKind, attributes) ||
				loggerIgnore(spanName, spanKind, attributes)
			) {
				return { decision: SamplingDecision.NOT_RECORD };
			}
			return parent.shouldSample(
				context,
				traceId,
				spanName,
				spanKind,
				attributes,
				links
			);
		},
		toString() {
			return `FilterSampler(${parent.toString()})`;
		},
	};
};
const _healthCheckTargets: string[] = ["/health", "/ready", "/live"];
const ignoreHealthCheck: ignoreHealthCheck = (
	_spanName: string,
	spanKind: SpanKind,
	attributes: Attributes
) => {
	return (
		spanKind === SpanKind.SERVER &&
		_healthCheckTargets.some(
			(it) => it === attributes[SemanticAttributes.HTTP_TARGET]
		)
	);
};

const _endpoints: string[] = [];
const ignoreEndpoints: ignoreHealthCheck = (
	spanName: string,
	spanKind: SpanKind,
	attributes: Attributes
) => {
	return (
		spanKind === SpanKind.CLIENT &&
		_endpoints.some((it) =>
			Boolean(
				attributes[SemanticAttributes.HTTP_URL]?.toString().startsWith(it)
			)
		)
	);
};

export const setIgnoreEndpoints = (...endpoints: string[]) =>
	_endpoints.push(...endpoints);

export const provider = new NodeTracerProvider({
	sampler: filterSampler(
		ignoreHealthCheck,
		ignoreEndpoints,
		new AlwaysOnSampler()
	),
});

registerInstrumentations({
	tracerProvider: provider,
	instrumentations: [
		getNodeAutoInstrumentations({
			"@opentelemetry/instrumentation-pino": {
				logHook: (span, record) => {
					record[SemanticResourceAttributes.SERVICE_NAME] =
						provider.resource.attributes[
							SemanticResourceAttributes.SERVICE_NAME
						];
				},
			},
			"@opentelemetry/instrumentation-express": {
				ignoreLayersType: [
					ExpressLayerType.MIDDLEWARE,
					ExpressLayerType.REQUEST_HANDLER,
				],
			},
		}),
	],
});
