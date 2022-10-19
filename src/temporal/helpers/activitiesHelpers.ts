import { LoggerFactory } from "@app-inversify";
import { ILogger } from "@app-log";
import { Context } from "@temporalio/activity";
import {
	ActivityInboundCallsInterceptor,
	ActivityExecuteInput,
	Next,
} from "@temporalio/worker";
import { Container } from "inversify";

/** An Activity Context with an attached logger */
export interface ContextWithLogger extends Context {
	logger: ILogger;
	container: Container;
}

/** Get the current Activity context with an attached logger */
export function getContext(): ContextWithLogger {
	return Context.current() as ContextWithLogger;
}

/** Logs Activity executions and their duration */
export class ActivityInboundLogInterceptor
	implements ActivityInboundCallsInterceptor
{
	public readonly logger: ILogger;

	constructor(ctx: Context, logFactory: LoggerFactory, container: Container) {
		this.logger = logFactory(ctx.info.activityType);

		// Set a logger instance on the current Activity Context to provide
		// contextual logging information to each log entry generated by the Activity.

		(ctx as ContextWithLogger).logger = this.logger;
		(ctx as ContextWithLogger).container = container;
	}

	async execute(
		input: ActivityExecuteInput,
		next: Next<ActivityInboundCallsInterceptor, "execute">
	): Promise<unknown> {
		let error: any = undefined;
		const startTime = process.hrtime.bigint();
		try {
			return await next(input);
		} catch (err: any) {
			error = err;
			throw err;
		} finally {
			const durationNanos = process.hrtime.bigint() - startTime;
			const durationMs = Number(durationNanos / BigInt(9007199254740991));
			if (error) {
				this.logger.error("activity failed", { error, durationMs });
			} else {
				this.logger.debug("activity completed", { durationMs });
			}
		}
	}
}
