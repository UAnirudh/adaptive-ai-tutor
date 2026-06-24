import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.toLowerCase() ?? "uanirudh0811@gmail.com";

export type AdminSession = {
  userId: string;
  email: string;
};

export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress;

  return email?.toLowerCase() ?? null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const email = await getCurrentUserEmail();
  if (email !== ADMIN_EMAIL) return null;

  return { userId, email };
}

export async function isAdminUser(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

export async function ensureDbUser(
  clerkUserId: string,
  email?: string | null
): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: clerkUserId },
  });

  if (existing) {
    if (email && existing.email !== email) {
      await prisma.user.update({
        where: { id: clerkUserId },
        data: { email },
      });
    }

    return existing.id;
  }

  const user = await prisma.user.create({
    data: { id: clerkUserId, email },
  });

  return user.id;
}
