import { Result } from "@http-client";
import { InterceptorSoap } from "@http-soap";

export class SoapHandlerResultInterceptor implements InterceptorSoap {
	OnSuccess([data]: any): Result<any> {
		if (data.return.code !== "0") {
			return Result.fail("Soap Result is Fail");
		}
		return Result.ok(data.return);
	}
	OnError(data: any): any {
		return data;
	}
}
