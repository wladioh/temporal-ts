import compression from "compression";
import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import { expressMetrics } from "@open-telemetry-express-metrics";
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
	useContextMiddleware,
} from "@app-middlewares";
import { ContextFiller } from "@utils/middlewares/contextFill";
import "./controllers";
import { StartHttp, LoggerFactory } from "@app-inversify";
import { TemporalWorkerStart } from "@temporal/worker";
/**
 * Build express application with all required middlewares and graphql server bindings
 * @param container
 */
export const Application = async (container: Container): Promise<void> => {
	const config = container.get<Configuration>(TYPES.Configuration);
	const logger = container.get<LoggerFactory>(TYPES.LoggerFactory)("EXPRESS");

	logger.info("Starting application...");
	hpropagate({
		setAndPropagateCorrelationId: false,
		headersToPropagate: ["cache-control"],
	});
	const application = express();
	const metrics = expressMetrics({
		ENDPOINT: config.TELEMETRY_ENDPOINT,
		ENABLE_DIAGNOSTIC: true,
		...config,
	});
	application
		.use(bodyParser.urlencoded({ extended: true }))
		.use(bodyParser.json())
		.use(metrics)
		.use(helmet())
		//	.use(compression())
		.use(cors())
		.use(logMiddleware(logger))
		.use(useContextMiddleware(ContextFiller));

	RegisterDocs(application);
	RegisterRoutes(application);
	application.use(notFoundHandler).use(unhandledError(logger));
	const temporalWorker = TemporalWorkerStart(
		config,
		container.get<LoggerFactory>(TYPES.LoggerFactory)
	);
	const httpServer = StartHttp(
		config.SERVER_PORT,
		config.MANAGEMENT_PORT,
		logger,
		application
	);
	await Promise.all([temporalWorker, httpServer]);
};
