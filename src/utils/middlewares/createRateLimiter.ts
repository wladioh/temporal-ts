import { Configuration } from "@config";
import { Request, Response, NextFunction } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
//import { RateLimiterRedis } from "rate-limiter-flexible";

export const createRateLimiter = (config: Configuration) => {
	const rateLimiter = new RateLimiterMemory({
		keyPrefix: "middleware",
		points: config.RATE_LIMITER_REQUEST, // 10 requests
		duration: config.RATE_LIMITER_INTERVAL_SECONDS, // per 1 second by IP
	});
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			await rateLimiter.consume(req.ip);
			next();
		} catch {
			res.status(429).send("Too Many Requests");
		}
	};
};
