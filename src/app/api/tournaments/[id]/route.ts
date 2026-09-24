import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeStandings } from "@/lib/standings";
import { createTournamentSchema, renameTournamentSchema } from "@/lib/validation";
import { createGroupsAndFixtures } from "@/lib/tournamentSetup";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      matches: {
        include: {
          homeUser: { select: { id: true, teamName: true, photoUrl: true } },
          awayUser: { select: { id: true, teamName: true, photoUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const standings = await computeStandings(id);

  return NextResponse.json({ tournament, standings });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.tournament.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const hasResults = (await prisma.match.count({ where: { tournamentId: id, homeScore: { not: null } } })) > 0;

  const body = await req.json().catch(() => null);

  if (hasResults) {
    // Once any result exists, format/players/groups are locked to protect
    // real match history — only the name can still be changed.
    const parsed = renameTournamentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: { name: parsed.data.name },
    });
    return NextResponse.json(updated);
  }

  const parsed = createTournamentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, userIds, legType, groupCount, startDate, knockoutFormat, hasThirdPlace } = parsed.data;

  const uniqueIds = Array.from(new Set(userIds));
  const users = await prisma.user.findMany({ where: { id: { in: uniqueIds } } });
  if (users.length !== uniqueIds.length) {
    return NextResponse.json({ error: "One or more selected players don't exist" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    // No results exist yet, so the whole group stage can be safely wiped
    // and regenerated from the new settings.
    await tx.match.deleteMany({ where: { tournamentId: id } });
    await tx.tournamentEntry.deleteMany({ where: { tournamentId: id } });
    await tx.group.deleteMany({ where: { tournamentId: id } });

    const tournament = await tx.tournament.update({
      where: { id },
      data: {
        name,
        legType,
        groupCount,
        startDate,
        knockoutFormat,
        hasThirdPlace: knockoutFormat === "SEMI_FINAL" ? hasThirdPlace : false,
      },
    });

    await createGroupsAndFixtures(tx, id, { userIds: uniqueIds, legType, groupCount, startDate });

    return tournament;
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.tournament.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  // Group, TournamentEntry, and Match rows all cascade-delete with the tournament.
  await prisma.tournament.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
