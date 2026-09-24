import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pending = await prisma.match.findMany({
    where: { status: "PENDING_APPROVAL" },
    include: {
      tournament: { select: { id: true, name: true } },
      homeUser: { select: { id: true, teamName: true, photoUrl: true } },
      awayUser: { select: { id: true, teamName: true, photoUrl: true } },
      submittedBy: { select: { id: true, username: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(pending);
}
