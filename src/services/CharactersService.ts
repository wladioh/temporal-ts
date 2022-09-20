import { logger, provideSingleton } from "@app-inversify";
import { ILogger } from "@app-log";
import { Api } from "@http-client";
import { CharactersApi } from "@utils/decorators/ApiDecorators";
import { Result } from "type-result";

export interface Character {
	id: string;
	name: string;
	friends: string[];
}
@provideSingleton(CharactersService) // or @provide(FooService)
export class CharactersService {
	constructor(
		@CharactersApi()
		private readonly paymentsApi: Api,
		@logger()
		private readonly logger: ILogger
	) {}
	async add(character: Character): Promise<Result<void, string>> {
		const response = await this.paymentsApi.post("/v1", character);
		if (response.status !== 200) return Result.fail("Problems happens =)");
		return Result.ok();
	}
	async get(): Promise<Result<Character[], string>> {
		const response = await this.paymentsApi.get("/v1");
		if (response.status !== 200) return Result.fail("Problems happens =)");
		return Result.ok(response.data);
	}
	async getById(id: string): Promise<Result<Character, string>> {
		const response = await this.paymentsApi.get(`/v1/${id}`);
		if (response.status !== 200) return Result.fail("Problems happens =)");
		return Result.ok(response.data);
	}
}
