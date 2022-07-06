import { ContextManager, IContextManager } from "@app-context-manager";
import { Request, Response } from "express";

export const customerCpfKey = "x-customer-cpf";
export const customerAccountPan = "x-account-pan";
export const cacheKey = "cache-control";

export const ignoreCache = () => ContextManager.Context.get(cacheKey) === true;

export const ContextFiller = (
	context: IContextManager,
	request: Request,
	_response: Response
) => {
	const isNoCache =
		request.headers["cache-control"]?.toLocaleLowerCase() === "no-cache";
	const cpf = request.headers["x-account-cpf"];
	const accountPan = request.headers["x-account-pan"];
	context.set(cacheKey, isNoCache);
	context.set(customerCpfKey, cpf);
	context.set(customerAccountPan, accountPan);
};
