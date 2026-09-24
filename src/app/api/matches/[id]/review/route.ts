import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviewResultSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = reviewResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: "This match has no result awaiting approval" }, { status: 409 });
  }

  const updated =
    parsed.data.action === "approve"
      ? await prisma.match.update({
          where: { id },
          data: {
            homeScore: match.pendingHomeScore,
            awayScore: match.pendingAwayScore,
            status: "APPROVED",
            approvedById: session.user.id,
            playedAt: match.playedAt ?? new Date(),
            pendingHomeScore: null,
            pendingAwayScore: null,
          },
        })
      : await prisma.match.update({
          where: { id },
          data: {
            status: match.homeScore != null ? "APPROVED" : "SCHEDULED",
            pendingHomeScore: null,
            pendingAwayScore: null,
          },
        });

  return NextResponse.json(updated);
}
