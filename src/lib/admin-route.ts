import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";

export async function requireAdminRoute() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const admin = await getAdminSession();
  if (!admin) {
    redirect("/");
  }

  return admin;
}
