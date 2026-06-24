import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function ensureDbUser(clerkUserId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: clerkUserId },
  });

  if (existing) return existing.id;

  const user = await prisma.user.create({
    data: { id: clerkUserId },
  });

  return user.id;
}
