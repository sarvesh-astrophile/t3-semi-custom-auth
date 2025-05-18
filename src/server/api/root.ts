import { userRouter } from "@/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	user: userRouter, // #1.1.1 User router
});

// export type definition of API
export type AppRouter = typeof appRouter;


export const createCaller = createCallerFactory(appRouter);
