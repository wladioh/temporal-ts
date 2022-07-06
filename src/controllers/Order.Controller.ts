import { Controller, Get, Path, Res, Route, TsoaResponse } from "tsoa";
import { ILogger } from "@app-log";
import { logger, provideSingleton } from "@app-inversify";
import { inject } from "inversify";
import { WorkflowClient } from "@temporalio/client";
import { RequestOrderCreateWorkflow } from "@temporal/workflows/orders";
import { v4 as uuidv4 } from "uuid";

@Route("order")
@provideSingleton(OrderController)
export class OrderController extends Controller {
	constructor(
		@logger() private logger: ILogger,
		@inject(WorkflowClient) private client: WorkflowClient
	) {
		super();
	}
	@Get()
	public async MakeOrder(
		@Res() notFoundResponse: TsoaResponse<404, { reason: string }>
	): Promise<{ orderId: string }> {
		this.logger.info("Start getCharacter..");
		const cartId = uuidv4();
		const handle = await this.client.start(RequestOrderCreateWorkflow, {
			workflowId: cartId,
			taskQueue: "tutorial",
			args: [cartId],
		});
		const orderId = await handle.result();
		if (!orderId) {
			return notFoundResponse(404, {
				reason: "We don't know you yet. Please provide a name",
			});
		}
		this.setStatus(200);
		return { orderId };
	}
}
