import { TYPES as _type } from "@app-inversify";
export const TYPES = {
	Cache: Symbol.for("Cache"),
	SOAP_CLIENT: Symbol.for("SOAP_CLIENT"),
	..._type,
};
