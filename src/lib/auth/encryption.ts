import {decodeBase64, encodeBase64} from "@oslojs/encoding";
import {createCipheriv, createDecipheriv} from "crypto";
import {DynamicBuffer} from "@oslojs/binary";

// 1.1.1.2 Encryption - updated
const key = decodeBase64(process.env.ENCRYPTION_KEY!);

export function encrypt(data: Uint8Array): Uint8Array {
  const iv = new Uint8Array(16);
  crypto.getRandomValues(iv);
  const cipher = createCipheriv("aes-128-gcm", key, iv);
  const encrypted = new DynamicBuffer(0);
  encrypted.write(iv);
  encrypted.write(cipher.update(data));
  encrypted.write(cipher.final());
  encrypted.write(cipher.getAuthTag());
  return encrypted.bytes();
}

export function encryptString(data: string): Uint8Array {
  return encrypt(new TextEncoder().encode(data));
}

export function decrypt(encrypted: Uint8Array): Uint8Array {
  if (encrypted.byteLength < 33) {
    throw new Error("Invalid encrypted data");
  }
  const decipher = createDecipheriv("aes-128-gcm", key, encrypted.slice(0, 16));
  decipher.setAuthTag(encrypted.slice(encrypted.byteLength - 16));
  const decrypted = new DynamicBuffer(0);
  decrypted.write(decipher.update(encrypted.slice(16, encrypted.byteLength - 16)));
  decrypted.write(decipher.final());
  return decrypted.bytes();
}

export function decryptString(encrypted: Uint8Array): string {
  return new TextDecoder().decode(decrypt(encrypted));
}

// Helper functions for handling base64-encoded encrypted data
export function decryptFromBase64String(base64String: string): string {
  const encryptedData = decodeBase64(base64String);
  return decryptString(encryptedData);
}

