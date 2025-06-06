import { z } from "zod";
import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { generateRandomCode } from "@/lib/utils";
import { sendEmailVerificationCode, setEmailVerificationCookie, deleteEmailVerificationCookie } from "@/lib/auth/email";
  
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
    .input(z.object({ userId:z.string().cuid("Invalid user ID format.") , email: z.string().email().cuid("Invalid email input format.") }))
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

      const verificationCode = Buffer.from(generateRandomCode());

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

      const emailVerificationRequest = await ctx.db.emailVerificationRequest.create({
        data: {
          id,
          user_id: input.userId,
          email: input.email,
          verification_code: verificationCode,
          expires_at: expiresAt,
        },
      });

      await setEmailVerificationCookie(id, expiresAt);

      await sendEmailVerificationCode(input.email, verificationCode.toString());

      return emailVerificationRequest;
    }),

    deleteEmailVerificationRequest: publicProcedure
    .input(z.object({ id: z.string().cuid("Invalid verification request ID format.") }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      await ctx.db.emailVerificationRequest.delete({ where: { id } });
      await deleteEmailVerificationCookie();
    }),
});


