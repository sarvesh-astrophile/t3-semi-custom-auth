import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { userRouter } from "./routers/auth-routes/user";
import { emailVerificationRouter } from "./routers/auth-routes/email-verification";
import { sessionRouter } from "./routers/auth-routes/session";
import { totpRouter } from "./routers/auth-routes/totp";
import { passkeyRouter } from "./routers/auth-routes/passkey";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	user: userRouter,
	emailVerification: emailVerificationRouter,
	session: sessionRouter,
	totp: totpRouter,
	passkey: passkeyRouter,	
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const caller = createCaller(createContext);
 * const res = await caller.post.all();
 *
 */
export const createCaller = createCallerFactory(appRouter);
