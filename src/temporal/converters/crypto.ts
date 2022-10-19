import crypto from "@ronomon/crypto-async";
import { DataConverter } from "@temporalio/common";
import { EncryptionCodec } from "./codec";
import RSA from "node-rsa";

const rsaKey = new RSA({ b: 512 });
rsaKey.setOptions({ encryptionScheme: "pkcs1" });

export function encrypt(data: Uint8Array): Promise<Uint8Array> {
	return new Promise(function (resolve, reject) {
		try {
			const buffer = rsaKey.encrypt(Buffer.from(data), "buffer");
			resolve(new Uint8Array(buffer));
		} catch (err) {
			reject(err);
		}
	});
}

export function decrypt(encryptedData: Uint8Array): Promise<Uint8Array> {
	return new Promise(function (resolve, reject) {
		try {
			const buffer = rsaKey.decrypt(Buffer.from(encryptedData), "buffer");
			resolve(new Uint8Array(buffer));
		} catch (error) {
			reject(error);
		}
	});
}
let dataConverterPromise: Promise<DataConverter>;

export async function getDataConverter(): Promise<DataConverter> {
	if (!dataConverterPromise) {
		dataConverterPromise = createDataConverter();
	}
	return dataConverterPromise;
}

async function createDataConverter(): Promise<DataConverter> {
	return {
		payloadCodecs: [new EncryptionCodec()],
	};
}
