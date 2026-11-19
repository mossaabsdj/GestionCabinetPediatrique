import { loadEnv } from "./env-loader";
loadEnv();

import { PrismaClient } from "@/app/generated/prisma"; // ✅ correct for your output path
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

