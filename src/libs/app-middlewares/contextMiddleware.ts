import { NextFunction, Request, Response } from "express";
import { ContextManager, IContextManager } from "@app-context-manager";

export const useContextMiddleware = (
	x: (context: IContextManager, request: Request, _response: Response) => void
) => {
	ContextManager.Init();
	return (request: Request, response: Response, next: NextFunction) => {
		ContextManager.Context.run(() => {
			x(ContextManager.Context, request, response);
			next();
		});
	};
};
