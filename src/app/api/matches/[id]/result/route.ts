import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { submitResultSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = submitResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { homeScore, awayScore } = parsed.data;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isParticipant = match.homeUserId === session.user.id || match.awayUserId === session.user.id;

  if (!isAdmin && !isParticipant) {
    return NextResponse.json({ error: "Only the players in this match or an admin can submit a result" }, { status: 403 });
  }

  if (match.stage !== "GROUP" && homeScore === awayScore) {
    return NextResponse.json(
      { error: "Knockout matches need a decisive score (extra time/penalties) — draws aren't allowed" },
      { status: 400 }
    );
  }

  const updated = isAdmin
    ? await prisma.match.update({
        where: { id },
        data: {
          homeScore,
          awayScore,
          status: "APPROVED",
          submittedById: session.user.id,
          approvedById: session.user.id,
          playedAt: match.playedAt ?? new Date(),
          pendingHomeScore: null,
          pendingAwayScore: null,
        },
      })
    : await prisma.match.update({
        where: { id },
        data: {
          pendingHomeScore: homeScore,
          pendingAwayScore: awayScore,
          status: "PENDING_APPROVAL",
          submittedById: session.user.id,
        },
      });

  return NextResponse.json(updated);
}
