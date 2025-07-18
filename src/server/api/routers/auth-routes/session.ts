import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
    generateSessionToken,
    createSession as utilCreateSession,
    setSessionTokenCookie,
    validateSession as utilValidateSession,
    invalidateSession as utilInvalidateSession,
    deleteSessionTokenCookie,
    invalidateUsersSessions as utilInvalidateUsersSessions,
    setSessionAs2FAVerified as utilSetSessionAs2FAVerified,
    getCurrentUserSession,
} from "@/lib/auth/session-utils";
import { TRPCError } from "@trpc/server";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { cookies } from "next/headers";

export const sessionRouter = createTRPCRouter({
    createSession: publicProcedure
        .input(
            z.object({
                userId: z.string().cuid("Invalid user ID format."),
                twoFactorVerified: z.boolean().optional().default(false),
            }),
        )
        .mutation(async ({ input }) => {
            const { userId, twoFactorVerified } = input;
            const token = generateSessionToken();
            const sessionFlags = { twoFactorVerified };
            const newSession = await utilCreateSession(token, userId, sessionFlags);
            await setSessionTokenCookie(token, newSession.expires_at);
            return {
                message: "Session created successfully.",
                sessionId: newSession.id,
                expiresAt: newSession.expires_at,
            };
        }),

    getSession: publicProcedure.query(async () => {
        const session = await getCurrentUserSession();
        if (!session) {
            return null;
        }
        return session;
    }),

    deleteSession: publicProcedure.mutation(async () => {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;
        if (token) {
            const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
            await utilInvalidateSession(sessionId);
        }
        await deleteSessionTokenCookie();
        return { message: "Session deleted successfully. User logged out." };
    }),

    invalidateUserSessions: publicProcedure
        .input(
            z.object({
                userId: z.string().cuid("Invalid user ID format."),
            }),
        )
        .mutation(async ({ input }) => {
            await utilInvalidateUsersSessions(input.userId);
            const cookieStore = await cookies();
            const currentToken = cookieStore.get("session")?.value;
            if (currentToken) {
                const validated = await utilValidateSession(currentToken);
                if (validated?.user?.id === input.userId) {
                    await deleteSessionTokenCookie();
                }
            }
            return { message: "All sessions for the user invalidated." };
        }),

    setSessionAsTwoFactorVerified: publicProcedure.mutation(async () => {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;
        if (!token) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "No session token provided.",
            });
        }
        const validated = await utilValidateSession(token);
        if (!validated || !validated.session) {
            await deleteSessionTokenCookie();
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Invalid or expired session.",
            });
        }
        const sessionId = validated.session.id;
        await utilSetSessionAs2FAVerified(sessionId);
        return { message: "Session marked as 2FA verified." };
    }),
});
