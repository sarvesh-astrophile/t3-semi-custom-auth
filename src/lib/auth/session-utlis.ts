import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { db } from "@/server/db";
import { cookies } from "next/headers";
import { env } from "@/env";
import { cache } from "react";

// #1.5.1 SessionFlags
export interface SessionFlags {
    twoFactorVerified: boolean;
}

// #1.5.1 Session
export interface Session extends SessionFlags {
    id: string;
    userId: string;
    expiresAt: Date;
}

// #1.5.1 generateSessionToken
export function generateSessionToken() {
    const tokenBytes = new Uint8Array(20);
    crypto.getRandomValues(tokenBytes);
    const token = encodeBase32LowerCaseNoPadding(tokenBytes);
    return token;
}

// #1.5.1 createSession
export async function createSession(token: string, userId: string, flags:SessionFlags) {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);  // Correctly add 30 days
    const createdSession = await db.session.create({
        data: {
            id: sessionId,
            user_id: userId,
            expires_at: expiresAt,
            two_factor_verified: flags.twoFactorVerified,
        },
    });
    return createdSession;
}

// #1.5.1 setSessionTokenCookie
export async function setSessionTokenCookie(token: string, expiresAt: Date) {
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
    });
}

// #1.5.1 deleteSessionTokenCookie
export async function deleteSessionTokenCookie() {
    const cookieStore = await cookies();
    cookieStore.set("session", "", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
    });
}

// #1.5.1 setSessionAs2FAVerified
export async function setSessionAs2FAVerified(sessionId: string) {
    await db.session.update({
        where: { id: sessionId },
        data: { two_factor_verified: true },
    });
}

// #1.5.1 invalidateSession
export async function invalidateSession(sessionId: string) {
    await db.session.delete({
        where: { id: sessionId },
    });
}

// #1.5.1 invalidateUsersSessions
export async function invalidateUsersSessions(userId: string) {
    await db.session.deleteMany({
        where: { user_id: userId },
    });
}

// #1.5.1 validateSession
export async function validateSession(token: string) {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const session = await db.session.findUnique({
        where: { id: sessionId },
    });
    if (!session) {
        return null;
    }
    const user = await db.user.findUnique({
        where: { id: session.user_id },
    });
    if (!user) {
        return null;
    }
    // #1.5.1 invalidate session if it has expired
    if (session.expires_at < new Date()) {
        await db.session.delete({
            where: { id: sessionId },
        });
        return {
            user: null,
            session: null,
        };
    }
    // #1.5.1 extend session if it is within 15 days of expiration
    if (session.expires_at < new Date(Date.now() + 1000 * 60 * 60 * 24 * 15)) {
        await db.session.update({
            where: { id: sessionId },
            data: { expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) },
        });
    }
    return { user, session };
}

export const getCurrentUserSession = cache(async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("session");
    if (!token) {
        return null;
    }
    const session = await validateSession(token.value);
    if (!session) {
        return null;
    }
    return session;
});