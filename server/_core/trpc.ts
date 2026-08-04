import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import { timingSafeEqual } from "node:crypto";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export function isValidOperationsAuthorization(
  authorization: string | undefined,
  configuredKey = process.env.OPERATIONS_API_KEY ?? "",
): boolean {
  if (!configuredKey || !authorization?.startsWith("Bearer ")) return false;
  const suppliedKey = authorization.slice("Bearer ".length);
  if (!suppliedKey) return false;
  const supplied = Buffer.from(suppliedKey);
  const expected = Buffer.from(configuredKey);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

/** Restricted service authentication for read and draft operations only. */
export const operationsProcedure = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    const isAdmin = ctx.user?.role === "admin";
    const hasServiceKey = isValidOperationsAuthorization(ctx.req.headers.authorization);
    if (!isAdmin && !hasServiceKey) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx });
  }),
);
