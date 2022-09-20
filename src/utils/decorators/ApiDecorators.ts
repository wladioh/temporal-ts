import { TYPES } from "../TYPES";
import { inject } from "inversify";
import { DecoratorTarget } from "inversify/lib/annotation/decorator_utils";

export function CharactersApi() {
	return (
		target: DecoratorTarget<unknown>,
		propertyKey: string | symbol,
		parameterIndex: number
	) => {
		inject(TYPES.CHARACTERS_API)(target, propertyKey, parameterIndex);
	};
}
