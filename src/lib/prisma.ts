import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getDatabaseUrl(): string {
  // En Vercel (producción), usar DIRECT_URL (conexión directa 5432)
  // En desarrollo local, usar DATABASE_URL
  if (process.env.NODE_ENV === "production") {
    return process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  }
  return process.env.DATABASE_URL || "";
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
