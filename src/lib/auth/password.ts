import { hash, verify } from "argon2";
import { encodeHexLowerCase } from "@oslojs/encoding"; // 1.1.1 Install @oslojs/encoding
import { sha1 } from "@oslojs/crypto/sha1"; // 1.1.1 Install @oslojs/crypto

// 1.1.1 Install argon2 for encryption
// 1.1.1 Hash password
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    hashLength: 32,
    parallelism: 1,
  });
}

// 1.1.1 Verify password
export async function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  return await verify(hash, password);
}

// 1.1.1 verifyPasswordStrength from ihavebeenpwned.com if password is compromised
export async function verifyPasswordStrength(password: string): Promise<boolean> {
  if (password.length < 8 || password.length > 225) {
    return false;
  }
  
  const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(password)));
  const hashPrefix = hash.slice(0, 5);
  const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`);
  const data = await response.text();
  const items = data.split("\n");
  for (const item of items) {
    const hashSuffix = item.slice(0, 35).toLowerCase();
    if (hash === hashPrefix + hashSuffix) {
      return false;
    }
  }
  return true;
}
