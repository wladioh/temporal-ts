import Joi from "joi";
import {
	UrlPattern,
	BaseConfiguration,
	ConfigurationSchemaBuilder,
} from "@app-config";
import { FeatureFlags, FeatureFlagSchema } from "./FeatureFlags";

type EnvConfigurations = {
	SERVER_PORT: number;
	MANAGEMENT_PORT: number;
	OTEL_COLLECTOR_TRACES: string;
	OTEL_COLLECTOR_METRICS: string;
	TEMPORAL_ADDRESS: string;
	RATE_LIMITER_REQUEST: number;
	RATE_LIMITER_INTERVAL_SECONDS: number;
};

type PocConfigService = {
	APP_CONFIG_CONNECTION_STRING: string;
	EVENT_HUB_ENDPOINT?: string;
	EVENT_HUB_CONSUMER_GROUP?: string;
	EVENT_HUB_NAME?: string;
};

const PocConfigServiceSchema: Joi.SchemaMap<PocConfigService> = {
	EVENT_HUB_ENDPOINT: Joi.string().optional(),
	EVENT_HUB_CONSUMER_GROUP: Joi.string().optional(),
	EVENT_HUB_NAME: Joi.string().optional(),
};

const EnvConfigurationsSchema: Joi.SchemaMap<EnvConfigurations> = {
	SERVER_PORT: Joi.number().default(8080),
	MANAGEMENT_PORT: Joi.number().default(8081),
	OTEL_COLLECTOR_TRACES: UrlPattern().required(),
	OTEL_COLLECTOR_METRICS: UrlPattern().required(),
	TEMPORAL_ADDRESS: Joi.string().required(),
	RATE_LIMITER_REQUEST: Joi.number().default(10),
	RATE_LIMITER_INTERVAL_SECONDS: Joi.number().default(1),
};

export type Configuration = BaseConfiguration &
	FeatureFlags &
	EnvConfigurations &
	PocConfigService;

export const ConfigurationSchema: Joi.ObjectSchema<Configuration> =
	ConfigurationSchemaBuilder.GivenConfiguration<Configuration>()
		.With(EnvConfigurationsSchema)
		.With(FeatureFlagSchema)
		.With(PocConfigServiceSchema)
		.Build();
