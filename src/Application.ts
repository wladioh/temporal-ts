import { TemporalWorkerStart } from "@temporal/worker";
import compression from "compression";
import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import { RegisterRoutes } from "./routes/routes";
import { Configuration } from "./Configuration";
import { Container } from "inversify";
import { TYPES } from "@utils/TYPES";
import hpropagate from "hpropagate";
import { RegisterDocs } from "./docs";
import {
	logMiddleware,
	notFoundHandler,
	unhandledError,
	createContextMiddleware,
} from "@app-middlewares";
import { createRateLimiter } from "@utils/middlewares/createRateLimiter";
import { ContextFiller } from "@utils/middlewares/contextFill";
import "./controllers";
import { LoggerFactory, HttpServer } from "@app-inversify";
import { GraphQlRegister } from "@utils/graphql/RegisterGraphql";
import { Express } from "express";
import { CorrelationId } from "@utils/middlewares/correlationId";
import { createExpressMetrics } from "@utils/middlewares/createExpressMetrics";
import { createHelmet } from "@utils/middlewares/createHelmet";

/**
 * Build express application with all required middlewares and graphql server bindings
 * @param container
 */
export const BuildApplication = async (
	container: Container
): Promise<Express> => {
	const config = container.get<Configuration>(TYPES.Configuration);
	const logger = container.get<LoggerFactory>(TYPES.LoggerFactory)("EXPRESS");

	logger.info("Starting application...");
	hpropagate({
		setAndPropagateCorrelationId: false,
		headersToPropagate: ["cache-control"],
	});
	const application = express();
	application
		.use(logMiddleware(logger))
		.use(createHelmet(config))
		.use(createRateLimiter(config))
		.use(compression())
		.use(cors())
		.use(bodyParser.urlencoded({ extended: true }))
		.use(bodyParser.json())
		.use(createContextMiddleware(ContextFiller))
		.use(CorrelationId);

	RegisterDocs(application);
	RegisterRoutes(application);
	await GraphQlRegister.Build(container).For(application).Register();
	application.use(notFoundHandler).use(unhandledError(logger));
	return application;
};

export const RunApplication = async (container: Container): Promise<void> => {
	const logger = container.get<LoggerFactory>(TYPES.LoggerFactory)("EXPRESS");
	const config = container.get<Configuration>(TYPES.Configuration);
	const application = await BuildApplication(container);

	const temporalWorker = TemporalWorkerStart(config, container);
	const httpServer = HttpServer(
		config.SERVER_PORT,
		config.MANAGEMENT_PORT,
		logger,
		application
	);
	await Promise.all([temporalWorker, httpServer]);
};
