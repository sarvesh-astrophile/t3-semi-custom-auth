-- CreateTable
CREATE TABLE "PasskeyCredentials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "algorithm" INTEGER NOT NULL,
    "public_key" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasskeyCredentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebAuthnChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challenge" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebAuthnChallenge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "registered_2FA" BOOLEAN NOT NULL DEFAULT false,
    "registered_totp" BOOLEAN NOT NULL DEFAULT false,
    "registered_passkey" BOOLEAN NOT NULL DEFAULT false,
    "registered_security_key" BOOLEAN NOT NULL DEFAULT false,
    "recovery_code" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "email_verified", "id", "name", "password_hash", "recovery_code", "registered_2FA", "registered_passkey", "registered_security_key", "registered_totp", "updatedAt") SELECT "createdAt", "email", "email_verified", "id", "name", "password_hash", "recovery_code", "registered_2FA", "registered_passkey", "registered_security_key", "registered_totp", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PasskeyCredentials_user_id_key" ON "PasskeyCredentials"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "WebAuthnChallenge_challenge_key" ON "WebAuthnChallenge"("challenge");
