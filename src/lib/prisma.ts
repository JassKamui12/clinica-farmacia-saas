import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// FORZAR el uso de DIRECT_URL (conexión directa 5432)
// Esto evita el error "prepared statement already exists" de PgBouncer
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

if (!databaseUrl) {
  console.error("ERROR: No database URL found. Set DIRECT_URL or DATABASE_URL");
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
