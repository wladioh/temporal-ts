import express from "express";

export function expressAuthentication(
	request: express.Request,
	securityName: string,
	scopes?: string[]
): Promise<any> {
	if (securityName === "bearer_token") {
		const token =
			request.body.token ||
			request.query.token ||
			request.headers["authorization"];

		if (token === "secret_token") {
			return Promise.resolve({
				id: 1,
				name: "Ironman",
			});
		}
	}
	return Promise.reject({});
}
