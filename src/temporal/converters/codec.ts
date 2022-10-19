import {
	METADATA_ENCODING_KEY,
	Payload,
	PayloadCodec,
	str,
	u8,
	ValueError,
} from "@temporalio/common";
import { temporal } from "@temporalio/proto";
import { decrypt, encrypt } from "./crypto";

const ENCODING = "binary/encrypted";
const METADATA_ENCRYPTION_KEY_ID = "encryption-key-id";

export class EncryptionCodec implements PayloadCodec {
	async encode(payloads: Payload[]): Promise<Payload[]> {
		return Promise.all(
			payloads.map(async (payload) => ({
				metadata: {
					[METADATA_ENCODING_KEY]: u8(ENCODING),
				},
				// Encrypt entire payload, preserving metadata
				data: await encrypt(
					temporal.api.common.v1.Payload.encodeDelimited(payload).finish()
				),
			}))
		);
	}

	async decode(payloads: Payload[]): Promise<Payload[]> {
		return Promise.all(
			payloads.map(async (payload) => {
				if (
					!payload.metadata ||
					str(payload.metadata[METADATA_ENCODING_KEY]) !== ENCODING
				) {
					return payload;
				}
				if (!payload.data) {
					throw new ValueError("Payload data is missing");
				}

				// const keyIdBytes = payload.metadata[METADATA_ENCRYPTION_KEY_ID];
				// if (!keyIdBytes) {
				// 	throw new ValueError(
				// 		"Unable to decrypt Payload without encryption key id"
				// 	);
				// }

				// const keyId = str(keyIdBytes);
				const decryptedPayloadBytes = await decrypt(payload.data);
				// console.log("Decrypting payload.data:", payload.data);
				return temporal.api.common.v1.Payload.decodeDelimited(
					decryptedPayloadBytes
				);
			})
		);
	}
}

async function fetchKey(_keyId: string): Promise<Buffer> {
	// In production, fetch key from a key management system (KMS). You may want to memoize requests if you'll be decoding
	// Payloads that were encrypted using keys other than defaultKeyId.
	return Buffer.from("test-key-test-key-test-key-test!");
}
