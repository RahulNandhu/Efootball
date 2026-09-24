import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTournamentSchema } from "@/lib/validation";
import { createGroupsAndFixtures } from "@/lib/tournamentSetup";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { entries: true, matches: true } } },
  });

  return NextResponse.json(tournaments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
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

  const tournament = await prisma.$transaction(async (tx) => {
    const created = await tx.tournament.create({
      data: {
        name,
        createdById: session.user.id,
        legType,
        groupCount,
        startDate,
        knockoutFormat,
        hasThirdPlace: knockoutFormat === "SEMI_FINAL" ? hasThirdPlace : false,
      },
    });

    await createGroupsAndFixtures(tx, created.id, { userIds: uniqueIds, legType, groupCount, startDate });

    return created;
  });

  return NextResponse.json(tournament, { status: 201 });
}
