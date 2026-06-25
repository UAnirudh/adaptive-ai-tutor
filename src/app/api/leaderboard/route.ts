import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();

  const top50 = await prisma.referralProfile.findMany({
    orderBy: { points: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const leaderboard = top50.map((entry, i) => ({
    rank: i + 1,
    name: entry.user.name ?? entry.user.email?.split("@")[0] ?? "Anonymous",
    referralCount: entry.referralCount,
    points: entry.points,
    isYou: entry.userId === userId,
  }));

  let myRank: { rank: number; points: number; referralCount: number; referralCode: string } | null = null;

  if (userId) {
    const myProfile = await prisma.referralProfile.findUnique({ where: { userId } });
    if (myProfile) {
      const aheadCount = await prisma.referralProfile.count({
        where: { points: { gt: myProfile.points } },
      });
      myRank = {
        rank: aheadCount + 1,
        points: myProfile.points,
        referralCount: myProfile.referralCount,
        referralCode: myProfile.referralCode,
      };
    }
  }

  return NextResponse.json({ leaderboard, myRank });
}
