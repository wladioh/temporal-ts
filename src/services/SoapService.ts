import { Result } from "@http-client";

type listPersonsAsyncRequest = {
	document: string;
};

export type SiccCard = {
	numero_cartao: string;
	nome_cliente: string;
	tipo_cartao: string;
	codigo_titularidade: string;
	codigo_situacao: string;
};

type listPersonsAsyncResponse = {
	cartoes: [SiccCard] | SiccCard;
};

type SoapResult<T> = Promise<Result<T>>;
export interface ISoapService {
	listPersonsAsync(
		request: listPersonsAsyncRequest
	): SoapResult<listPersonsAsyncResponse>;
}
