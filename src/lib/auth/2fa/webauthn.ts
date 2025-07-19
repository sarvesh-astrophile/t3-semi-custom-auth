import { encodeBase64url, decodeBase64url } from "@oslojs/encoding";
import { db } from "@/server/db";

export interface WebAuthnUserCredential {
    id: string;
    userId: string;
    name: string;
    algorithm: number;
    publicKey: Uint8Array;
    createdAt: Date;
}

// Generate a cryptographically secure base64url-encoded challenge
export function generateChallenge(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return encodeBase64url(bytes);
}

// Create and store a WebAuthn challenge with 5-minute expiry
export async function createWebAuthnChallenge(userId: string): Promise<string> {
    const challenge = generateChallenge();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Delete any existing challenges for this user
    await db.webAuthnChallenge.deleteMany({
        where: { user_id: userId }
    });

    await db.webAuthnChallenge.create({
        data: {
            challenge,
            user_id: userId,
            expires_at: expiresAt,
        },
    });

    return challenge;
}

// Verify and consume a WebAuthn challenge
export async function verifyWebAuthnChallenge(challenge: string, userId: string): Promise<boolean> {
    const storedChallenge = await db.webAuthnChallenge.findFirst({
        where: {
            challenge,
            user_id: userId,
            expires_at: {
                gt: new Date()
            }
        }
    });

    if (!storedChallenge) {
        return false;
    }

    // Delete the challenge after use (one-time use)
    await db.webAuthnChallenge.delete({
        where: { id: storedChallenge.id }
    });

    return true;
}

// Create a new passkey credential in the database
export async function createPasskeyCredential(
    credentialId: Uint8Array,
    userId: string,
    name: string,
    algorithm: number,
    publicKey: Uint8Array
): Promise<WebAuthnUserCredential> {
    const credential = await db.passkeyCredentials.create({
        data: {
            id: encodeBase64url(credentialId),
            user_id: userId,
            name,
            algorithm,
            public_key: publicKey,
        },
    });

    return {
        id: credential.id,
        userId: credential.user_id,
        name: credential.name,
        algorithm: credential.algorithm,
        publicKey: credential.public_key,
        createdAt: credential.createdAt,
    };
}

// Get a passkey credential by credential ID
export async function getPasskeyCredentialById(credentialId: string): Promise<WebAuthnUserCredential | null> {
    const credential = await db.passkeyCredentials.findUnique({
        where: { id: credentialId }
    });

    if (!credential) {
        return null;
    }

    return {
        id: credential.id,
        userId: credential.user_id,
        name: credential.name,
        algorithm: credential.algorithm,
        publicKey: credential.public_key,
        createdAt: credential.createdAt,
    };
}

// Get all passkey credentials for a user
export async function getUserPasskeyCredentials(userId: string): Promise<WebAuthnUserCredential[]> {
    const credentials = await db.passkeyCredentials.findMany({
        where: { user_id: userId }
    });

    return credentials.map(credential => ({
        id: credential.id,
        userId: credential.user_id,
        name: credential.name,
        algorithm: credential.algorithm,
        publicKey: credential.public_key,
        createdAt: credential.createdAt,
    }));
}

// Get credential IDs for a user (used for authentication allowCredentials)
export async function getUserPasskeyCredentialIds(userId: string): Promise<string[]> {
    const credentials = await getUserPasskeyCredentials(userId);
    return credentials.map(cred => cred.id);
} 