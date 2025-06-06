import { z } from "zod";
import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { generateRandomCode } from "@/lib/utils";
import { sendEmailVerificationCode, setEmailVerificationCookie, deleteEmailVerificationCookie } from "@/lib/auth/email";
import { TRPCError } from "@trpc/server";
import { getCurrentUserSession } from "@/lib/auth/session-utlis";
import { cookies } from "next/headers";

export const emailVerificationRouter = createTRPCRouter({
  /**
   * Retrieves an email verification request by its ID and the associated user's ID.
   * This matches the logic of the getUserEmailVerificationRequest function provided by the user,
   * adapted to use Prisma.
   */
  getUserEmailVerificationRequest: publicProcedure
    .input(
      z.object({
        id: z.string().cuid("Invalid verification request ID format."),
        userId: z.string().cuid("Invalid user ID format."),
      }),
    )
    .query(async ({ ctx, input }) => {
      const emailVerificationRequest =
        await ctx.db.emailVerificationRequest.findFirst({
          where: {
            id: input.id,
            user_id: input.userId,
          },
        });

      if (!emailVerificationRequest) {
        return null;
      }
      return emailVerificationRequest;
    }),

  createEmailVerificationRequest: publicProcedure
    .input(
      z.object({
        userId: z.string().cuid("Invalid user ID format."),
        email: z.string().email("Invalid email format."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // delete existing verification request
      await ctx.db.emailVerificationRequest.deleteMany({
        where: {
          user_id: input.userId,
        },
      });

      const idBytes = new Uint8Array(20);
      crypto.getRandomValues(idBytes);
      const id = encodeBase32UpperCaseNoPadding(idBytes);

      const code = generateRandomCode();

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

      const emailVerificationRequest =
        await ctx.db.emailVerificationRequest.create({
          data: {
            id,
            user_id: input.userId,
            email: input.email,
            verification_code: code,
            expires_at: expiresAt,
          },
        });

      await setEmailVerificationCookie(id, expiresAt);

      await sendEmailVerificationCode(input.email, code);

      return emailVerificationRequest;
    }),

  verifyEmail: publicProcedure
    .input(z.object({ code: z.string().min(1, "Code cannot be empty") }))
    .mutation(async ({ ctx, input }) => {
      const session = await getCurrentUserSession();
      if (!session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const cookieStore = await cookies();
      const emailVerificationCookie = cookieStore.get("emailVerification");

      if (!emailVerificationCookie?.value) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verification request not found. Please request a new one.",
        });
      }

      const emailVerificationRequest =
        await ctx.db.emailVerificationRequest.findFirst({
          where: {
            id: emailVerificationCookie.value,
            user_id: session.user.id,
          },
        });

      if (!emailVerificationRequest) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification request.",
        });
      }

      if (emailVerificationRequest.expires_at < new Date()) {
        await ctx.db.emailVerificationRequest.delete({
          where: { id: emailVerificationRequest.id },
        });
        await deleteEmailVerificationCookie();
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verification code expired. Please request a new one.",
        });
      }

      const storedCode = emailVerificationRequest.verification_code;

      if (storedCode.toUpperCase() !== input.code.toUpperCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification code.",
        });
      }

      await ctx.db.user.update({
        where: { id: session.user.id },
        data: { email_verified: true },
      });

      await ctx.db.emailVerificationRequest.delete({
        where: { id: emailVerificationRequest.id },
      });

      await deleteEmailVerificationCookie();

      return { success: true };
    }),

  resendVerificationEmail: publicProcedure.mutation(async ({ ctx }) => {
    const session = await getCurrentUserSession();
    if (!session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const user = await ctx.db.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user || !user.email) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    }

    const RATE_LIMIT_SECONDS = 60;
    const lastRequest = await ctx.db.emailVerificationRequest.findFirst({
      where: { user_id: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (lastRequest) {
      const timeSinceLastRequest =
        Date.now() - lastRequest.createdAt.getTime();
      const timeToWait = RATE_LIMIT_SECONDS * 1000 - timeSinceLastRequest;

      if (timeToWait > 0) {
        const secondsToWait = Math.ceil(timeToWait / 1000);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Please wait ${secondsToWait} more second(s) before requesting a new code.`,
        });
      }
    }

    await ctx.db.emailVerificationRequest.deleteMany({
      where: {
        user_id: user.id,
      },
    });

    const idBytes = new Uint8Array(20);
    crypto.getRandomValues(idBytes);
    const id = encodeBase32UpperCaseNoPadding(idBytes);

    const verificationCode = generateRandomCode();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const emailVerificationRequest =
      await ctx.db.emailVerificationRequest.create({
        data: {
          id,
          user_id: user.id,
          email: user.email,
          verification_code: verificationCode,
          expires_at: expiresAt,
        },
      });

    await setEmailVerificationCookie(id, expiresAt);
    await sendEmailVerificationCode(user.email, verificationCode);

    return { success: true };
  }),

  deleteEmailVerificationRequest: publicProcedure
    .input(
      z.object({ id: z.string().cuid("Invalid verification request ID format.") }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      await ctx.db.emailVerificationRequest.delete({ where: { id } });
      await deleteEmailVerificationCookie();
    }),
});


