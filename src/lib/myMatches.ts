import { prisma } from "@/lib/prisma";

const opponentSelect = { select: { id: true, teamName: true, photoUrl: true } } as const;

export async function getUpcomingMatches(userId: string, limit = 5) {
  return prisma.match.findMany({
    where: {
      OR: [{ homeUserId: userId }, { awayUserId: userId }],
      homeScore: null,
    },
    include: {
      tournament: { select: { id: true, name: true } },
      homeUser: opponentSelect,
      awayUser: opponentSelect,
    },
    orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
}

export async function getRecentResults(userId: string, limit = 5) {
  return prisma.match.findMany({
    where: {
      OR: [{ homeUserId: userId }, { awayUserId: userId }],
      homeScore: { not: null },
    },
    include: {
      tournament: { select: { id: true, name: true } },
      homeUser: opponentSelect,
      awayUser: opponentSelect,
    },
    orderBy: [{ playedAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });
}
