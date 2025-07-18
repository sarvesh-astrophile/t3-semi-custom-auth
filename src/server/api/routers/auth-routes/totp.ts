import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { encodeBase64, decodeBase64 } from "@oslojs/encoding";
import { createTOTPKeyURI, verifyTOTP } from "@oslojs/otp";
import { env } from "@/env";
import { TRPCError } from "@trpc/server";
import { setSessionAs2FAVerified } from "@/lib/auth/session-utils";
import { cookies } from "next/headers";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { encrypt, decrypt } from "@/lib/auth/encryption";

export const totpRouter = createTRPCRouter({
	verifyLogin: protectedProcedure
		.input(
			z.object({
				code: z.string().length(6, "Invalid code format."),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { user, session } = ctx;

			if (!user || !session) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to verify TOTP.",
				});
			}

			// Check if session is already 2FA verified
			if (session.two_factor_verified) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Session is already verified.",
				});
			}

			const totpCredentials = await db.tOTPCredentials.findUnique({
				where: { user_id: user.id },
			});

			if (!totpCredentials) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "TOTP credentials not found for this user.",
				});
			}

			const encryptedKey = decodeBase64(totpCredentials.totp_key);
			const key = decrypt(encryptedKey);
			const isValid = verifyTOTP(key, 30, 6, input.code);

			if (!isValid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid TOTP code.",
				});
			}

			// Mark session as 2FA verified
			const cookieStore = await cookies();
			const token = cookieStore.get("session")?.value;
			if (token) {
				const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
				await setSessionAs2FAVerified(sessionId);
			}

			return { success: true, message: "TOTP verified successfully." };
		}),

	generateTotpSecret: protectedProcedure.mutation(async ({ ctx }) => {
		const { user, session } = ctx;

		if (!user || !session) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to set up TOTP.",
			});
		}

		const totpKey = new Uint8Array(20);
		crypto.getRandomValues(totpKey);
		const encodedTOTPKey = encodeBase64(totpKey);
		const encryptedKey = encrypt(totpKey);
		const encodedEncryptedKey = encodeBase64(encryptedKey);


		await db.tOTPCredentials.upsert({
			where: { user_id: user.id },
			update: { totp_key: encodedEncryptedKey },
			create: {
				user_id: user.id,
				totp_key: encodedEncryptedKey,
			},
		});

		const issuerName = env.WEBSITE_URL || "http://localhost:3000";
		const totpUrl = createTOTPKeyURI(
			issuerName,
			user.email,
			totpKey,
			30,
			6
		);

		return {
			totpUrl,
			encodedTOTPKey,
		};
	}),

	verifyTotp: protectedProcedure
		.input(
			z.object({
				code: z.string().length(6, "Invalid code format."),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { user, session } = ctx;

			if (!user || !session) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to verify TOTP.",
				});
			}

			const totpCredentials = await db.tOTPCredentials.findUnique({
				where: { user_id: user.id },
			});

			if (!totpCredentials) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "TOTP credentials not found for this user.",
				});
			}

			const encryptedKey = decodeBase64(totpCredentials.totp_key);
			const key = decrypt(encryptedKey);
			const isValid = verifyTOTP(key, 30, 6, input.code);

			if (!isValid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid TOTP code.",
				});
			}

			await db.user.update({
				where: { id: user.id },
				data: {
					registered_totp: true,
					registered_2FA: true,
				},
			});

			const cookieStore = await cookies();
			const token = cookieStore.get("session")?.value;
			if (token) {
				const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
				await setSessionAs2FAVerified(sessionId);
			}

			return { success: true, message: "TOTP verified successfully." };
		}),
}); 