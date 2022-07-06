import {
	Body,
	Controller,
	Get,
	Path,
	Post,
	Query,
	Route,
	SuccessResponse,
	Security,
} from "tsoa";
import { inject } from "inversify";
import { Character, CharactersService } from "@services/CharactersService";
import { ILogger } from "@app-log";
import { Configuration } from "@config";
import { config, logger, provideSingleton } from "@app-inversify";
import { FeatureFilter } from "@app-config-azure-appconfiguration";

@Route("characters")
@provideSingleton(UsersController)
export class UsersController extends Controller {
	constructor(
		@inject(CharactersService) private charactersService: CharactersService,
		@logger() private logger: ILogger,
		@config() private config: Configuration
	) {
		super();
	}

	@Get("{characterId}")
	public async getCharacter(
		@Path() characterId: number,
		@Query() name?: string
	): Promise<Character[]> {
		this.logger.info("TESTE " + this.config.SERVICE_NAME);
		const result = await this.charactersService.all();
		return <Character[]>result.value;
	}
	private injectFault() {
		const fail = Math.random();
		if (fail <= this.config.FAIL_INJECTION_RATE) {
			throw new Error("SERVER ERROR");
		}
	}
	@SuccessResponse("201", "Created") // Custom success response
	@Post()
	@Security("bearer_token", ["admin"])
	public async createUser(
		@Body() requestBody: Character
	): Promise<Character | string> {
		this.logger.info("TESTE %s", this.config.SERVICE_NAME);
		this.logger.info("LOG LEVEL %s", this.config.LOG_LEVEL);
		this.injectFault();
		if (
			this.config.TESTE_FEATURE &&
			FeatureFilter.IsEnabled(this.config.TESTE_FEATURE)
		) {
			this.logger.warn("----------------> Feature");
		}
		this.charactersService.add(requestBody);
		this.setStatus(201); // set return status 201
		return requestBody;
	}
}
