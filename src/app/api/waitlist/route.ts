import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.email().max(254),
  name: z.string().max(120).optional(),
  interest: z.string().max(1000).optional(),
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

    await prisma.waitlistEntry.upsert({
      where: { email },
      update: {
        name: parsed.data.name?.trim() || undefined,
        interest: parsed.data.interest?.trim() || undefined,
        source: "waitlist",
      },
      create: {
        email,
        name: parsed.data.name?.trim() || undefined,
        interest: parsed.data.interest?.trim() || undefined,
        source: "waitlist",
      },
    });

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
