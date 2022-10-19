import type * as activities from "../activities"; // purely for type safety
import { Saga } from "../helpers/saga";
import * as wf from "@temporalio/workflow";
import { LoggerSinks } from "@temporal/helpers/sinks";

const myActivities = wf.proxyActivities<typeof activities>({
	startToCloseTimeout: "1 minute",
	retry: {
		maximumAttempts: 3,
	},
});

type PurchaseState =
	| "ORDER_PENDING"
	| "ORDER_CONFIRM"
	| "ORDER_CANCELED"
	| "ORDER_FINISHED";
const { logger } = wf.proxySinks<LoggerSinks>();

export const confirmOrder = wf.defineSignal("confirmOrder");
export const cancelOrder = wf.defineSignal("cancelOrder");
export const purchaseStateQuery = wf.defineQuery<PurchaseState>("orderState");

export async function RequestOrderCreateWorkflow(
	cartId: string
): Promise<string | undefined> {
	const orderId = wf.uuid4();
	let purchaseState: PurchaseState = "ORDER_PENDING";
	await wf.startChild(CreateOrderFromCart, {
		args: [cartId],
		parentClosePolicy: wf.ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
		workflowId: orderId,
	});
	wf.setHandler(confirmOrder, () => {
		purchaseState = "ORDER_CONFIRM";
	});
	wf.setHandler(cancelOrder, () => {
		purchaseState = "ORDER_CANCELED";
	});
	wf.setHandler(purchaseStateQuery, () => purchaseState);
	await wf.condition(() => purchaseState !== "ORDER_PENDING", "10s");
	purchaseState = "ORDER_FINISHED";
	return orderId;
}

export async function CreateOrderFromCart(cartId: string): Promise<void> {
	const saga = new Saga();
	try {
		const orderId = wf.workflowInfo().workflowId;
		await myActivities.createOrderFromCart(cartId, orderId);
		saga.addCompensation(myActivities.cancelOrder, orderId, cartId);
		// const value = CAL DESC.
		await wf.sleep("1 seconds");
		await myActivities.bookItems(orderId);
		saga.addCompensation(myActivities.cancelBookedItems, orderId);
		await wf.sleep("1 seconds");
		await myActivities.applyCoupons(orderId);
		saga.addCompensation(myActivities.reverteCoupons, orderId);
		await myActivities.requestPayment(orderId, cartId);
		await wf.sleep("1 minutes"); //
		saga.addCompensation(myActivities.cancelPayment, orderId);
		await wf.sleep("1 seconds");
		await myActivities.orderPaid(orderId);
		///https://github.com/temporalio/samples-typescript/tree/main/patching-api/src
		if (wf.patched("CALC_DESCONTO")) {
			//TODO: FAZ O NOVO CODIGO
			//todo envar um  email com o valor
		} else {
			//TODO: CODIGO ANTIGO
		}
		saga.addCompensation(myActivities.orderRevertPaid, orderId);
		logger.info("Saga Complete With Success");
	} catch (error) {
		logger.info("Saga Compensation");
		await saga.compensate();
	} finally {
		logger.info("Saga Finally");
	}
}
