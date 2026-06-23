import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is required. Set it in your .env or Railway variables."
    );
  }

  try {
    const adapter = new PrismaPg({ connectionString });
    const client = new PrismaClient({ adapter }) as unknown as PrismaClient;
    return client;
  } catch (error) {
    console.error("Failed to initialize Prisma Client:", error);
    throw error;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
