import { LoggerFactory } from "@app-inversify";
import * as wf from "@temporalio/workflow";

export interface LoggerSinks extends wf.Sinks {
	logger: {
		debug(message: string, meta?: any): void;
		info(message: string, meta?: any): void;
		error(message: string, meta?: any): void;
		warn(message: string, meta?: any): void;
	};
}

export const getLogger = (loggerFactory: LoggerFactory) => {
	return {
		debug: {
			fn(workflowInfo, message, meta) {
				loggerFactory(workflowInfo.workflowType).debug(message, meta);
			},
		},
		info: {
			fn(workflowInfo, message, meta) {
				loggerFactory(workflowInfo.workflowType).info(message, meta);
			},
		},
		error: {
			fn(workflowInfo, message, meta) {
				loggerFactory(workflowInfo.workflowType).error(message, meta);
			},
		},
		warn: {
			fn(workflowInfo, message, meta) {
				loggerFactory(workflowInfo.workflowType).warn(message, meta);
			},
		},
	};
};
