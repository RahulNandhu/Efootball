import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeStandings } from "@/lib/standings";

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
