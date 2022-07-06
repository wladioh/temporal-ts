import { provideSingleton } from "@app-inversify";
import Result from "fluent-type-results";
import { Result as Res } from "type-result";

export interface Character {
	name: string;
	friends: string[];
}

const resources: Character[] = [];
@provideSingleton(CharactersService) // or @provide(FooService)
export class CharactersService {
	all(): PromiseLike<Result<Character[]>> {
		return Promise.resolve(Result.Ok(resources));
	}
	add(character: Character) {
		resources.push(character);
	}
	get(): Res<string, string> {
		return Res.fail("");
	}
}
