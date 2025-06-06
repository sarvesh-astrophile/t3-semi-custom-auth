import { cookies } from "next/headers";
import { env } from "@/env";

// 2.1.2 send email verification code start with console log
export async function sendEmailVerificationCode(email: string, code: string) {
  console.log("Sending email verification code to", email, "with code:", code);
  return;
}


// function to set and delete cookie for email verification request
export async function setEmailVerificationCookie(id: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set("emailVerification", id, {
    httpOnly: true, path: "/", 
    secure: env.NODE_ENV === "production", 
    sameSite: "lax", 
    expires: expiresAt});
}

export async function deleteEmailVerificationCookie() {
const cookieStore = await cookies();
cookieStore.set("emailVerification", "", {
  httpOnly: true, 
  path: "/", 
  secure: env.NODE_ENV === "production", 
  sameSite: "lax", 
  maxAge: 0});
}