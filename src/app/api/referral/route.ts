import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { ensureDbUser } from "@/lib/auth";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let profile = await prisma.referralProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
    await ensureDbUser(userId, email);

    let code = generateCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const exists = await prisma.referralProfile.findUnique({ where: { referralCode: code } });
      if (!exists) break;
      code = generateCode();
    }

    profile = await prisma.referralProfile.create({
      data: { userId, referralCode: code },
    });
  }

  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json();
  const code = (body.referralCode as string)?.trim().toUpperCase();

  if (!code || code.length < 4) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
  }

  const existing = await prisma.referralProfile.findUnique({ where: { userId } });
  if (existing?.referredBy) {
    return NextResponse.json({ error: "You've already used a referral code" }, { status: 400 });
  }

  const referrer = await prisma.referralProfile.findUnique({ where: { referralCode: code } });
  if (!referrer) {
    return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
  }

  if (referrer.userId === userId) {
    return NextResponse.json({ error: "You can't use your own code" }, { status: 400 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  await ensureDbUser(userId, email);

  await prisma.$transaction([
    prisma.referralProfile.upsert({
      where: { userId },
      update: { referredBy: referrer.userId },
      create: { userId, referralCode: generateCode(), referredBy: referrer.userId },
    }),
    prisma.referralProfile.update({
      where: { userId: referrer.userId },
      data: {
        referralCount: { increment: 1 },
        points: { increment: 100 },
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
