import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 1.1.1 generate random recovery code
export function generateRandomRecoveryCode(): string {
  const recoveryCodeBytes = new Uint8Array(10);
  crypto.getRandomValues(recoveryCodeBytes);
  const recoveryCode = encodeBase32UpperCaseNoPadding(recoveryCodeBytes);
  return recoveryCode;
}

// 2.1.1 generate random code for email verification
export function generateRandomCode(): string {
  const codeBytes = new Uint8Array(5);
  crypto.getRandomValues(codeBytes);
  const code = encodeBase32UpperCaseNoPadding(codeBytes);
  return code;
}