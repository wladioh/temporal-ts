import { NextFunction, Request, Response } from "express";
import { ContextManager, IContextManager } from "@app-context-manager";
export type ContextFiller = (
	context: IContextManager,
	request: Request,
	response: Response
) => void;
export const createContextMiddleware = (filler: ContextFiller) => {
	ContextManager.Init();
	return (request: Request, response: Response, next: NextFunction) => {
		ContextManager.Context.run(() => {
			filler(ContextManager.Context, request, response);
			next();
		});
	};
};
