import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.email().max(254),
  name: z.string().max(120).optional(),
  interest: z.string().max(1000).optional(),
  referralCode: z.string().max(20).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = waitlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();

    const refCode = parsed.data.referralCode?.trim().toUpperCase();
    const source = refCode ? `referral:${refCode}` : "waitlist";

    await prisma.waitlistEntry.upsert({
      where: { email },
      update: {
        name: parsed.data.name?.trim() || undefined,
        interest: parsed.data.interest?.trim() || undefined,
        source,
      },
      create: {
        email,
        name: parsed.data.name?.trim() || undefined,
        interest: parsed.data.interest?.trim() || undefined,
        source,
      },
    });

    if (refCode) {
      await prisma.referralProfile.updateMany({
        where: { referralCode: refCode },
        data: {
          referralCount: { increment: 1 },
          points: { increment: 100 },
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Waitlist error:", message, error);

    return NextResponse.json(
      { error: "We could not save that email. Please try again." },
      { status: 500 }
    );
  }
}
