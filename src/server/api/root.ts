import { userRouter } from "@/server/api/routers/auth-routes/user";
import { emailVerificationRouter } from "@/server/api/routers/auth-routes/email-verification";
import { sessionRouter } from "@/server/api/routers/auth-routes/session";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	user: userRouter, // #1.1.1 User router
	emailVerification: emailVerificationRouter, // #2.1.1 Email verification router
	session: sessionRouter, // #1.5.1 Session router
});

// export type definition of API
export type AppRouter = typeof appRouter;


export const createCaller = createCallerFactory(appRouter);
