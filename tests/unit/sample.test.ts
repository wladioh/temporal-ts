import {
	Api,
	AuthInterceptor,
	LoggerInterceptor,
} from "../../src/libs/http-client";
import { CreateResiliencyConfig } from "../../src/libs/http-resiliency";
import { createMock } from "ts-auto-mock";
import { ILogger } from "../../src/libs/app-api/LoggerApi";
import { ContextManager } from "../../src/libs/app-context-manager";
import { response } from "express";
describe("Example - unit Test", () => {
	beforeEach(() => {
		jest.resetAllMocks();
		jest.restoreAllMocks();
	});

	describe("Exemples", () => {
		it.skip("Skip first exemple", async () => {
			expect(1).toBe(1);
		});
		it.skip("first exemple", async () => {
			ContextManager.Init();
			const logger = createMock<ILogger>();
			const apiConfig = CreateResiliencyConfig(logger, {
				baseURL: "http://localhost:8080/teste/",
				validateStatus: (status: number) => status !== 401 && status !== 403,
			});
			const api = new Api(apiConfig);
			const expected = { message: "oi" };
			const result = await api.get("teste", {
				fallback: {
					data: expected,
					status: [404],
					whenResult: (response) => {
						return !response;
					},
				},
			});
			expect(200).toEqual(result.status);
			expect(expected).toEqual(result.data);
		});
	});
});
