import { MetricsConfiguration, registerMetrics } from "./metrics";
import ResponseTime from "response-time";

export const expressMetrics = (config: Partial<MetricsConfiguration>) => {
	const metricCollector = registerMetrics(config);
	return ResponseTime(metricCollector.record.bind(metricCollector));
};
