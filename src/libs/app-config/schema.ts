import { LogLevel } from "@app-api/LoggerApi";
import Joi, { ObjectSchema } from "joi";

export enum NodeEnv {
	TEST = "TEST",
	LOCAL = "LOCAL",
	DEV = "DEV",
	QA = "QA",
	HOMOLG = "HOMOLOG",
	PRODUCTION = "PRODUCTION",
}

export type BaseConfiguration = {
	NODE_ENV: NodeEnv;
	SERVICE_NAME: string;
	LOG_LEVEL: LogLevel;
};

export const schemaBasic = Joi.object<BaseConfiguration>({
	NODE_ENV: Joi.string()
		.uppercase()
		.required()
		.valid(...Object.values(NodeEnv)),
	LOG_LEVEL: Joi.string()
		.lowercase()
		.default(LogLevel.info)
		.valid(...Object.values(LogLevel)),
	SERVICE_NAME: Joi.string().required(),
})
	.unknown(false)
	.options({
		abortEarly: false,
		stripUnknown: { arrays: false, objects: true },
	});

export const BuildSchema = <T>(schema: Joi.SchemaMap<T>): ObjectSchema<T> => {
	return schemaBasic
		.append<T>(schema)
		.unknown(false)
		.options({
			abortEarly: false,
			stripUnknown: { arrays: false, objects: true },
		});
};
