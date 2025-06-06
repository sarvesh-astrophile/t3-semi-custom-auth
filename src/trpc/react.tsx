"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  loggerLink,
  splitLink,
  httpBatchLink,
  httpBatchStreamLink,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import SuperJSON from "superjson";

import type { AppRouter } from "@/server/api/root";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  clientQueryClientSingleton ??= createQueryClient();

  return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: {
  children: React.ReactNode;
  headers: Headers; // #2.1.1
}) {
  const [queryClient] = useState(() => getQueryClient()); // #2.1.1

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        splitLink({
          // #2.1.1
          condition(op) {
            return (
              op.path.startsWith("auth.") ||
              op.path.startsWith("session.") ||
              op.path.startsWith("emailVerification.")
            );
          },
          true: httpBatchLink({
            url: `${getBaseUrl()}/api/trpc`,
            transformer: SuperJSON,
            headers() {
              const heads = new Map(props.headers);
              heads.set("x-trpc-source", "react-no-stream");
              return Object.fromEntries(heads);
            },
            fetch: (url: URL | RequestInfo, options?: RequestInit) => {
              return fetch(url, {
                ...options,
                credentials: "include",
              });
            },
          }),
          false: httpBatchStreamLink({
            url: `${getBaseUrl()}/api/trpc`,
            transformer: SuperJSON,
            headers() {
              const heads = new Map(props.headers);
              heads.set("x-trpc-source", "react-stream");
              return Object.fromEntries(heads);
            },
            fetch: (url: URL | RequestInfo, options?: RequestInit) => {
              return fetch(url, {
                ...options,
                credentials: "include",
              });
            },
          }),
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
