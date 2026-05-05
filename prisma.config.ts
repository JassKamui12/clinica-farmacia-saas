import type { PrismaConfig } from "@prisma/client";

const config: PrismaConfig = {
  datasources: [
    {
      provider: "postgresql",
      url: process.env.DATABASE_URL!,
      directUrl: process.env.DIRECT_URL,
    },
  ],
};

export default config;
