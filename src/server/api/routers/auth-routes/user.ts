import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { hashPassword, verifyPasswordStrength, verifyPasswordHash } from "@/lib/auth/password";
import { generateRandomRecoveryCode } from "@/lib/utils";
import { encrypt, encryptString } from "@/lib/auth/encryption";
import { 
  generateSessionToken, 
  createSession, 
  setSessionTokenCookie,
  invalidateUsersSessions
} from "@/lib/auth/session-utils";
import { encodeBase64 } from "@oslojs/encoding";
import { TRPCError } from "@trpc/server";
// 1.1.1 User router - updated

export const userRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate input
      if (!input.email || !input.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email and password are required.",
        });
      }

      // Find user by email
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid email or password.",
        });
      }

      // Verify password
      const isPasswordValid = await verifyPasswordHash(input.password, user.password_hash);
      if (!isPasswordValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid email or password.",
        });
      }

      // Invalidate any existing sessions for this user
      await invalidateUsersSessions(user.id);

      // Check if user has 2FA enabled
      const has2FA = user.registered_2FA && user.registered_totp;

      // Generate session token
      const token = generateSessionToken();
      
      if (has2FA) {
        // Create session with 2FA not verified
        const sessionFlags = { twoFactorVerified: false };
        const newSession = await createSession(token, user.id, sessionFlags);
        await setSessionTokenCookie(token, newSession.expires_at);
        
        return { twoFactorRequired: true };
      } else {
        // Create session with 2FA verified (no 2FA required)
        const sessionFlags = { twoFactorVerified: true };
        const newSession = await createSession(token, user.id, sessionFlags);
        await setSessionTokenCookie(token, newSession.expires_at);
        
        return { twoFactorRequired: false };
      }
    }),

  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(3), // Changed from username to name
        password: z.string().min(8), // For now, only min length, detailed regex is on client
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists (optional, but good practice)
      const existingUserByEmail = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (existingUserByEmail) {
        throw new Error("Email already exists."); // Or use TRPCError
      }
      // Removed check for existing username as name is not unique

      // Verify password strength
      const isPasswordStrong = await verifyPasswordStrength(input.password);
      if (!isPasswordStrong) {
        throw new Error(
          "Password is too weak or has been compromised. Please choose a stronger password."
        );
      }

      // Generate recovery code
      const passwordHash = await hashPassword(input.password);
      const recoveryCode = generateRandomRecoveryCode();
      const encryptedRecoveryCode = encryptString(recoveryCode);
      const recoveryCodeString = encodeBase64(encryptedRecoveryCode);

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          name: input.name, 
          password_hash: passwordHash, 
          recovery_code: recoveryCodeString,
        },
      });

      return user;
    }),
});
