import { container, TYPES, LoggerFactory } from "../../libs/app-inversify";
import { ILogger } from "../../libs/app-log";
import {
	WorkflowInterceptorsFactory,
	WorkflowInboundCallsInterceptor,
	WorkflowExecuteInput,
	Next,
} from "@temporalio/workflow";

class WorkflowInboundLogInterceptor implements WorkflowInboundCallsInterceptor {
	constructor(private logger: ILogger) {}
	async execute(
		input: WorkflowExecuteInput,
		next: Next<WorkflowInboundCallsInterceptor, "execute">
	): Promise<unknown> {
		let error: any = undefined;
		const startTime = Date.now();
		try {
			return await next(input);
		} catch (err: any) {
			error = err;
			throw err;
		} finally {
			const durationMs = Date.now() - startTime;
			if (error) {
				this.logger.error("workflow failed", { error, durationMs });
			} else {
				this.logger.debug("workflow completed", { durationMs });
			}
		}
	}
}

export const interceptors: WorkflowInterceptorsFactory = () => ({
	inbound: [
		new WorkflowInboundLogInterceptor(
			container.get<LoggerFactory>(TYPES.LoggerFactory)("WORKFLOW")
		),
	],
});
