import * as wf from "@temporalio/workflow";
import {
	OpenTelemetryInboundInterceptor,
	OpenTelemetryOutboundInterceptor,
} from "@temporalio/interceptors-opentelemetry/lib/workflow";

export const interceptors: wf.WorkflowInterceptorsFactory = () => ({
	inbound: [new OpenTelemetryInboundInterceptor()],
	outbound: [new OpenTelemetryOutboundInterceptor()],
});
