import { TYPES } from "@app-inversify";
import { Configuration } from "@config";
import { Context } from "@temporalio/activity";
import { getContext } from "./helpers";
import {
	confirmOrder as signalConfirmOrder,
	cancelOrder as signalCancelOrder,
} from "./workflows/orders";
import { WorkflowClient } from "@temporalio/client";
import { temporal } from "@temporalio/proto";

const failChange = 0;
const fail = (customFailChange?: number) => {
	const attempt = Math.random() * 100;
	const change = customFailChange || failChange;
	if (attempt <= change) {
		throw new Error("attempt failed.");
	}
};

export const createOrderFromCart = async (
	cartId: string,
	orderId: string
): Promise<string> => {
	const { logger, container } = getContext();
	const config = container.get<Configuration>(TYPES.Configuration);
	logger.info(`createOrderFromCart ${cartId}! ${config.LOG_LEVEL}`);
	fail();
	return orderId;
};

export const cancelOrder = async (
	id: string,
	cartId: string
): Promise<string> => {
	const { logger, container } = getContext();
	const client = container.get<WorkflowClient>(WorkflowClient);
	const handle = await client.getHandle(cartId);
	const describe = await handle.describe();
	const wfIsRunning =
		describe.status.code ==
		temporal.api.enums.v1.WorkflowExecutionStatus
			.WORKFLOW_EXECUTION_STATUS_RUNNING;
	if (wfIsRunning) {
		await handle.signal(signalCancelOrder);
	}
	logger.info(`cancelOrder ${id}!`);
	return Context.current().info.activityId;
};

export const bookItems = async (id: string): Promise<string> => {
	const { logger } = getContext();
	logger.info(`bookItems ${id}!`);
	fail();
	return Context.current().info.activityId;
};
export const cancelBookedItems = async (id: string): Promise<string> => {
	const { logger } = getContext();
	logger.info(`cancelBookedItems ${id}!`);
	return Context.current().info.activityId;
};

export const applyCoupons = async (id: string): Promise<string> => {
	const { logger } = getContext();
	logger.info(`applyCupoms ${id}!`);
	fail();
	return Context.current().info.activityId;
};

export async function reverteCoupons(id: string): Promise<string> {
	const { logger } = getContext();
	logger.info(`reverteCupoms ${id}!`);
	return Context.current().info.activityId;
}

export async function requestPayment(
	orderId: string,
	cartId: string
): Promise<string> {
	const { logger, container } = getContext();
	logger.info(`requestPayment ${orderId}!`);
	fail();
	const client = container.get<WorkflowClient>(WorkflowClient);
	const handle = await client.getHandle(cartId);
	await handle.signal(signalConfirmOrder);
	return Context.current().info.activityId;
}

export async function cancelPayment(id: string): Promise<string> {
	const { logger } = getContext();
	logger.info(`cancelPayment ${id}!`);
	return Context.current().info.activityId;
}

export async function orderPaid(id: string): Promise<string> {
	const { logger } = getContext();
	logger.info(`orderPaid ${id}!`);
	fail(100);
	return Context.current().info.activityId;
}

export async function orderRevertPaid(id: string): Promise<string> {
	const { logger } = getContext();
	logger.info(`orderRevertPaid ${id}!`);
	return Context.current().info.activityId;
}
