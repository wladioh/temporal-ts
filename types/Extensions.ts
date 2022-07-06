import http = require("http");
declare module "response-time" {
	namespace responseTime {
		export type IncomingMessage = http.IncomingMessage & {
			get: (name: string) => any;
		};
		export interface ResponseTimeFunction {
			(
				request: IncomingMessage,
				response: http.ServerResponse,
				time: number
			): any;
		}
	}
}
