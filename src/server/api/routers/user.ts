import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db"; // Assuming prisma client is exported as db from @/server/db

// 1.1.1 User router - updated

export const userRouter = createTRPCRouter({
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
        throw new Error("Email already in use."); // Or use TRPCError
      }
      // Removed check for existing username as name is not unique

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          name: input.name, // Changed from username to name
          password_hash: input.password, // Storing password directly as per instruction
        },
      });

      return user;
    }),
});
