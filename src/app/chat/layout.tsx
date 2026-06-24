import { requireAdminRoute } from "@/lib/admin-route";

export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminRoute();
  return children;
}
