import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

/**
 * Singleton PrismaClient. Each service process gets exactly one pool;
 * re-exported here so the same module resolution caches it across imports.
 */
export const prisma = globalThis.__prismaClient ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient = prisma;
}

export * from "@prisma/client";
