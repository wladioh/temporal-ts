import { Controller, Get, Path, Route } from "tsoa";
import { ILogger } from "@app-log";
import { Api } from "@http-client";
import { logger, provideSingleton } from "@app-inversify";
import { inject } from "inversify";

//TODO: ESTA CONTROLLER É UTILIZADO COM PROPOSITO DE TESTE PODE SER REMOVIDA
@Route("run_test")
@provideSingleton(RunTestController)
export class RunTestController extends Controller {
	constructor(
		@inject(Api) private api: Api,
		@logger() private logger: ILogger
	) {
		super();
	}

	@Get("{id}")
	public async getCharacter(@Path() id: string): Promise<any> {
		this.logger.info("Start getCharacter..");
		const createdCat = await this.api.post(
			"/characters",
			{
				name: "Tom",
				friends: ["Jerry"],
			},
			{
				fallback: {
					data: {
						status: "404",
					},
				},
				cache: {
					methods: ["POST"],
				},
			}
		);
		if (createdCat.status == 201) {
			this.setStatus(201);
			return createdCat.data;
		}
		this.setStatus(500);
		return "BAD REQUEST";
	}
}
