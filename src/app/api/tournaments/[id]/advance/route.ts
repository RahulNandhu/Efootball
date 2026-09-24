import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getQualifiers } from "@/lib/standings";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { matches: { where: { stage: { not: "GROUP" } } } },
  });
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  if (tournament.knockoutFormat === "NONE") {
    return NextResponse.json({ error: "This tournament has no knockout stage" }, { status: 400 });
  }

  const semis = tournament.matches.filter((m) => m.stage === "SEMI_FINAL");
  const final = tournament.matches.find((m) => m.stage === "FINAL");

  if (final) {
    return NextResponse.json({ error: "The knockout stage is already complete" }, { status: 409 });
  }

  // FINAL-only format: go straight from the table to a final.
  if (tournament.knockoutFormat === "FINAL") {
    const [q1, q2] = await getQualifiers(id, 2);
    if (!q1 || !q2) {
      return NextResponse.json({ error: "Not enough teams with standings to fill the final" }, { status: 400 });
    }

    const match = await prisma.match.create({
      data: {
        tournamentId: id,
        stage: "FINAL",
        homeUserId: q1.userId,
        awayUserId: q2.userId,
        scheduledDate: new Date(),
      },
    });

    return NextResponse.json({ created: [match] }, { status: 201 });
  }

  // SEMI_FINAL format.
  if (semis.length === 0) {
    const [q1, q2, q3, q4] = await getQualifiers(id, 4);
    if (!q1 || !q2 || !q3 || !q4) {
      return NextResponse.json({ error: "Not enough teams with standings to fill the semi-finals" }, { status: 400 });
    }

    const created = await prisma.$transaction([
      prisma.match.create({
        data: {
          tournamentId: id,
          stage: "SEMI_FINAL",
          slot: 1,
          homeUserId: q1.userId,
          awayUserId: q4.userId,
          scheduledDate: new Date(),
        },
      }),
      prisma.match.create({
        data: {
          tournamentId: id,
          stage: "SEMI_FINAL",
          slot: 2,
          homeUserId: q2.userId,
          awayUserId: q3.userId,
          scheduledDate: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ created }, { status: 201 });
  }

  const unfinished = semis.filter((m) => m.status !== "APPROVED");
  if (unfinished.length > 0) {
    return NextResponse.json(
      { error: "Both semi-final results must be approved before advancing" },
      { status: 409 }
    );
  }

  const sf1 = semis.find((m) => m.slot === 1)!;
  const sf2 = semis.find((m) => m.slot === 2)!;

  const winner = (m: (typeof semis)[number]) => (m.homeScore! > m.awayScore! ? m.homeUserId : m.awayUserId);
  const loser = (m: (typeof semis)[number]) => (m.homeScore! > m.awayScore! ? m.awayUserId : m.homeUserId);

  const toCreate = [
    prisma.match.create({
      data: {
        tournamentId: id,
        stage: "FINAL" as const,
        homeUserId: winner(sf1),
        awayUserId: winner(sf2),
        scheduledDate: new Date(),
      },
    }),
  ];

  if (tournament.hasThirdPlace) {
    toCreate.push(
      prisma.match.create({
        data: {
          tournamentId: id,
          stage: "THIRD_PLACE" as const,
          homeUserId: loser(sf1),
          awayUserId: loser(sf2),
          scheduledDate: new Date(),
        },
      })
    );
  }

  const created = await prisma.$transaction(toCreate);

  return NextResponse.json({ created }, { status: 201 });
}
