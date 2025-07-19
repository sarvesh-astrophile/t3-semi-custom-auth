
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { parseAttestationObject, parseAuthenticatorData, ClientDataType } from "@oslojs/webauthn";
import { decodeBase64, encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "@/server/db";
import { cookies } from "next/headers";
import { sha256 as cryptoSha256 } from "@oslojs/crypto/sha2";
import {
    createWebAuthnChallenge,
    createPasskeyCredential,
    getPasskeyCredentialById,
    getUserPasskeyCredentialIds,
    getUserPasskeyCredentials,
    type WebAuthnUserCredential,
} from "@/lib/auth/2fa/webauthn";
import {
    generatePasskeyRegistrationOptions,
    generatePasskeyAuthenticationOptions,
    validateAttestationStatement,
    validateAuthenticatorData,
    validateClientData,
    extractPublicKey,
    verifyPasskeySignature,
    createPasskeySignatureMessage,
} from "@/lib/auth/2fa/passkey-utils";
import { setSessionAs2FAVerified } from "@/lib/auth/session-utils";

export const passkeyRouter = createTRPCRouter({
    generateRegistrationOptions: protectedProcedure.mutation(async ({ ctx }) => {
        const { user } = ctx;

        if (!user) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "You must be logged in to register a passkey.",
            });
        }

        const challenge = await createWebAuthnChallenge(user.id);
        return generatePasskeyRegistrationOptions(user.id, user.email, user.name, challenge);
    }),

    verifyRegistration: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1, "Name is required"),
                attestationObject: z.string(),
                clientDataJSON: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { user } = ctx;

            if (!user) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to register a passkey.",
                });
            }

            try {
                const attestationObjectBytes = decodeBase64(input.attestationObject);
                const clientDataJSONBytes = decodeBase64(input.clientDataJSON);

                // Parse attestation object
                const { attestationStatement, authenticatorData } = parseAttestationObject(attestationObjectBytes);

                // Validate attestation statement format
                validateAttestationStatement(attestationStatement.format);

                // Validate authenticator data (requiring credential for registration)
                validateAuthenticatorData(authenticatorData, true);

                // Validate client data JSON
                await validateClientData(clientDataJSONBytes, ClientDataType.Create, user.id);

                // Extract and validate public key
                const { algorithm, publicKeyBytes } = extractPublicKey(authenticatorData.credential!.publicKey);

                // Save credential to database
                await createPasskeyCredential(
                    authenticatorData.credential!.id,
                    user.id,
                    input.name,
                    algorithm,
                    publicKeyBytes
                );

                // Update user flags
                await db.user.update({
                    where: { id: user.id },
                    data: {
                        registered_passkey: true,
                        registered_2FA: true,
                    },
                });

                // Mark session as 2FA verified
                const cookieStore = await cookies();
                const token = cookieStore.get("session")?.value;
                if (token) {
                    const sessionId = encodeHexLowerCase(cryptoSha256(new TextEncoder().encode(token)));
                    await setSessionAs2FAVerified(sessionId);
                }

                return {
                    success: true,
                    message: "Passkey registered successfully",
                };
            } catch (error) {
                console.error("Passkey registration error:", error);
                if (error instanceof TRPCError) {
                    throw error;
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to register passkey",
                });
            }
        }),

    generateAuthenticationOptions: protectedProcedure.mutation(async ({ ctx }) => {
        const { user } = ctx;

        if (!user) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "You must be logged in to authenticate with a passkey.",
            });
        }

        const challenge = await createWebAuthnChallenge(user.id);
        const credentialIds = await getUserPasskeyCredentialIds(user.id);

        if (credentialIds.length === 0) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "No passkeys found for this user",
            });
        }

        return generatePasskeyAuthenticationOptions(challenge, credentialIds);
    }),

    verifyAuthentication: protectedProcedure
        .input(
            z.object({
                credentialId: z.string(),
                signature: z.string(),
                authenticatorData: z.string(),
                clientDataJSON: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { user } = ctx;

            if (!user) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to authenticate with a passkey.",
                });
            }

            try {
                const credentialId = input.credentialId;
                const signatureBytes = decodeBase64(input.signature);
                const authenticatorDataBytes = decodeBase64(input.authenticatorData);
                const clientDataJSONBytes = decodeBase64(input.clientDataJSON);

                // Parse authenticator data
                const authenticatorData = parseAuthenticatorData(authenticatorDataBytes);

                // Validate authenticator data (no credential required for authentication)
                validateAuthenticatorData(authenticatorData, false);

                // Validate client data JSON
                await validateClientData(clientDataJSONBytes, ClientDataType.Get, user.id);

                // Get stored credential
                const storedCredential = await getPasskeyCredentialById(credentialId);
                if (!storedCredential || storedCredential.userId !== user.id) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Credential not found or does not belong to user",
                    });
                }

                // Create signature message and verify
                const messageHash = createPasskeySignatureMessage(authenticatorDataBytes, clientDataJSONBytes);
                const isValidSignature = verifyPasskeySignature(
                    storedCredential.algorithm,
                    storedCredential.publicKey,
                    signatureBytes,
                    messageHash
                );

                if (!isValidSignature) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Invalid signature",
                    });
                }

                // Mark session as 2FA verified
                const cookieStore = await cookies();
                const token = cookieStore.get("session")?.value;
                if (token) {
                    const sessionId = encodeHexLowerCase(cryptoSha256(new TextEncoder().encode(token)));
                    await setSessionAs2FAVerified(sessionId);
                }

                return {
                    success: true,
                    message: "Passkey authentication successful",
                };
            } catch (error) {
                console.error("Passkey authentication error:", error);
                if (error instanceof TRPCError) {
                    throw error;
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to authenticate with passkey",
                });
            }
        }),

    getUserPasskeys: protectedProcedure.query(async ({ ctx }) => {
        const { user } = ctx;

        if (!user) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "You must be logged in to view your passkeys.",
            });
        }

        const passkeys = await getUserPasskeyCredentials(user.id);
        return passkeys.map((passkey: WebAuthnUserCredential) => ({
            id: passkey.id,
            name: passkey.name,
            algorithm: passkey.algorithm,
            createdAt: passkey.createdAt,
        }));
    }),

    deletePasskey: protectedProcedure
        .input(z.object({
            passkeyId: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { user } = ctx;

            if (!user) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You must be logged in to delete a passkey.",
                });
            }

            // Verify the passkey belongs to the user
            const passkey = await getPasskeyCredentialById(input.passkeyId);
            if (!passkey || passkey.userId !== user.id) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Passkey not found or does not belong to you.",
                });
            }

            // Delete the passkey
            await db.passkeyCredentials.delete({
                where: { id: input.passkeyId }
            });

            // Check if user has any remaining passkeys
            const remainingPasskeys = await getUserPasskeyCredentials(user.id);
            if (remainingPasskeys.length === 0) {
                // Update user flags if no passkeys remain
                await db.user.update({
                    where: { id: user.id },
                    data: {
                        registered_passkey: false,
                        // Only disable 2FA if no other 2FA methods are enabled
                        registered_2FA: user.registered_totp || user.registered_security_key,
                    },
                });
            }

            return {
                success: true,
                message: "Passkey deleted successfully",
            };
        }),
});
