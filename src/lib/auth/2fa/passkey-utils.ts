import { TRPCError } from "@trpc/server";
import { decodeBase64url, encodeBase64url } from "@oslojs/encoding";
import {
    parseClientDataJSON,
    parseAuthenticatorData,
    ClientDataType,
    AttestationStatementFormat,
    coseAlgorithmES256,
    coseAlgorithmRS256,
    coseEllipticCurveP256,
    COSEKeyType,
    createAssertionSignatureMessage,
    type COSEEC2PublicKey,
    type COSERSAPublicKey,
} from "@oslojs/webauthn";
import { ECDSAPublicKey, p256, verifyECDSASignature, decodePKIXECDSASignature, decodeSEC1PublicKey } from "@oslojs/crypto/ecdsa";
import { RSAPublicKey, verifyRSASSAPKCS1v15Signature, sha256ObjectIdentifier, decodePKCS1RSAPublicKey } from "@oslojs/crypto/rsa";
import { sha256 } from "@oslojs/crypto/sha2";
import { env } from "@/env";
import { verifyWebAuthnChallenge } from "@/lib/auth/2fa/webauthn";

export interface PasskeyRegistrationOptions {
    challenge: Uint8Array;
    rp: {
        name: string;
        id: string;
    };
    user: {
        id: Uint8Array;
        name: string;
        displayName: string | null;
    };
    pubKeyCredParams: Array<{
        alg: number;
        type: "public-key";
    }>;
    attestation: "none";
    authenticatorSelection: {
        userVerification: "required";
        residentKey: "required";
    };
    timeout: number;
}

export interface PasskeyAuthenticationOptions {
    challenge: Uint8Array;
    allowCredentials: Array<{
        type: "public-key";
        id: Uint8Array;
    }>;
    userVerification: "required";
    timeout: number;
}

export interface ExtractedPublicKey {
    algorithm: number;
    publicKeyBytes: Uint8Array;
}

/**
 * Generate registration options for passkey creation
 */
export function generatePasskeyRegistrationOptions(
    userId: string,
    userEmail: string,
    userName: string | null,
    challenge: string
): PasskeyRegistrationOptions {
    const challengeBytes = decodeBase64url(challenge);

    return {
        challenge: challengeBytes,
        rp: {
            name: env.WEBSITE_URL || "T3 App",
            id: process.env.NODE_ENV === "production" ? env.WEBSITE_URL?.replace("https://", "") || "localhost" : "localhost",
        },
        user: {
            id: new TextEncoder().encode(userId),
            name: userEmail,
            displayName: userName,
        },
        pubKeyCredParams: [
            {
                alg: coseAlgorithmES256, // -7
                type: "public-key" as const,
            },
            {
                alg: coseAlgorithmRS256, // -257
                type: "public-key" as const,
            },
        ],
        attestation: "none" as const,
        authenticatorSelection: {
            userVerification: "required" as const,
            residentKey: "required" as const,
        },
        timeout: 60000,
    };
}

/**
 * Generate authentication options for passkey verification
 */
export function generatePasskeyAuthenticationOptions(
    challenge: string,
    credentialIds: string[]
): PasskeyAuthenticationOptions {
    const challengeBytes = decodeBase64url(challenge);

    return {
        challenge: challengeBytes,
        allowCredentials: credentialIds.map((id: string) => ({
            type: "public-key" as const,
            id: decodeBase64url(id),
        })),
        userVerification: "required" as const,
        timeout: 60000,
    };
}

/**
 * Get the expected origin based on environment
 */
export function getExpectedOrigin(): string {
    return process.env.NODE_ENV === "production" 
        ? env.WEBSITE_URL || "https://localhost:3000"
        : "http://localhost:3001";
}

/**
 * Get the relying party ID based on environment
 */
export function getRelyingPartyId(): string {
    return process.env.NODE_ENV === "production" 
        ? env.WEBSITE_URL?.replace("https://", "") || "localhost"
        : "localhost";
}

/**
 * Validate attestation statement format
 */
export function validateAttestationStatement(format: AttestationStatementFormat): void {
    if (format !== AttestationStatementFormat.None) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported attestation statement format",
        });
    }
}

/**
 * Validate authenticator data for registration/authentication
 */
export function validateAuthenticatorData(
    authenticatorData: any,
    requireCredential: boolean = false
): void {
    // Verify relying party ID
    const relyingPartyId = getRelyingPartyId();
    if (!authenticatorData.verifyRelyingPartyIdHash(relyingPartyId)) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid relying party ID hash",
        });
    }

    // Verify user presence and verification
    if (!authenticatorData.userPresent || !authenticatorData.userVerified) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User must be present and verified",
        });
    }

    // Verify credential exists (for registration)
    if (requireCredential && !authenticatorData.credential) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Missing credential in authenticator data",
        });
    }
}

/**
 * Validate client data JSON
 */
export async function validateClientData(
    clientDataJSONBytes: Uint8Array,
    expectedType: ClientDataType,
    userId: string
): Promise<void> {
    const clientData = parseClientDataJSON(clientDataJSONBytes);

    // Verify client data type
    if (clientData.type !== expectedType) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid client data type",
        });
    }

    // Verify challenge
    const challenge = encodeBase64url(clientData.challenge);
    const isChallengeValid = await verifyWebAuthnChallenge(challenge, userId);
    if (!isChallengeValid) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired challenge",
        });
    }

    // Verify origin
    const expectedOrigin = getExpectedOrigin();
    if (clientData.origin !== expectedOrigin) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid origin",
        });
    }

    // Verify cross-origin
    if (clientData.crossOrigin !== null && clientData.crossOrigin) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cross-origin requests not allowed",
        });
    }
}

/**
 * Extract and validate public key from COSE key
 */
export function extractPublicKey(cosePublicKey: any): ExtractedPublicKey {
    let algorithm: number;
    let publicKeyBytes: Uint8Array;

    if (cosePublicKey.type() === COSEKeyType.EC2) {
        if (cosePublicKey.algorithm() !== coseAlgorithmES256) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Unsupported EC2 algorithm",
            });
        }

        const ec2Key = cosePublicKey.ec2();
        if (ec2Key.curve !== coseEllipticCurveP256) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Unsupported elliptic curve",
            });
        }

        algorithm = coseAlgorithmES256;
        const ecdsaPublicKey = new ECDSAPublicKey(p256, ec2Key.x, ec2Key.y);
        publicKeyBytes = ecdsaPublicKey.encodeSEC1Uncompressed();
    } else if (cosePublicKey.type() === COSEKeyType.RSA) {
        if (cosePublicKey.algorithm() !== coseAlgorithmRS256) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Unsupported RSA algorithm",
            });
        }

        algorithm = coseAlgorithmRS256;
        const rsaKey = cosePublicKey.rsa();
        const rsaPublicKey = new RSAPublicKey(rsaKey.n, rsaKey.e);
        publicKeyBytes = rsaPublicKey.encodePKCS1();
    } else {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported public key type",
        });
    }

    return { algorithm, publicKeyBytes };
}

/**
 * Verify signature for passkey authentication
 */
export function verifyPasskeySignature(
    algorithm: number,
    publicKeyBytes: Uint8Array,
    signatureBytes: Uint8Array,
    messageHash: Uint8Array
): boolean {
    try {
        if (algorithm === coseAlgorithmES256) {
            const ecdsaSignature = decodePKIXECDSASignature(signatureBytes);
            const ecdsaPublicKey = decodeSEC1PublicKey(p256, publicKeyBytes);
            return verifyECDSASignature(ecdsaPublicKey, messageHash, ecdsaSignature);
        } else if (algorithm === coseAlgorithmRS256) {
            const rsaPublicKey = decodePKCS1RSAPublicKey(publicKeyBytes);
            return verifyRSASSAPKCS1v15Signature(
                rsaPublicKey,
                sha256ObjectIdentifier,
                messageHash,
                signatureBytes
            );
        } else {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Unsupported algorithm for stored credential",
            });
        }
    } catch (error) {
        console.error("Signature verification error:", error);
        return false;
    }
}

/**
 * Create signature message for authentication verification
 */
export function createPasskeySignatureMessage(
    authenticatorDataBytes: Uint8Array,
    clientDataJSONBytes: Uint8Array
): Uint8Array {
    const signatureMessage = createAssertionSignatureMessage(authenticatorDataBytes, clientDataJSONBytes);
    return sha256(signatureMessage);
}
