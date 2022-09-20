import { FeatureFlag, FeatureFlagValue } from "@app-config";
import Joi from "joi";

export type FeatureFlags = {
	SESSION_VALIDATION_FEATURE: FeatureFlagValue;
};

export const FeatureFlagSchema: Joi.SchemaMap<FeatureFlags> = {
	SESSION_VALIDATION_FEATURE: FeatureFlag(),
};
