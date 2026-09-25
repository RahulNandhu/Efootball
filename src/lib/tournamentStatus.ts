import { prisma } from "@/lib/prisma";
import { computeStandings } from "@/lib/standings";

export type TournamentStatus = {
  finished: boolean;
  championTeamName: string | null;
};

/**
 * A tournament counts as finished once its decisive result exists: the
 * FINAL match (when there's a knockout stage) or, for a table-only
 * tournament, once every group-stage match has been approved. Grouped
 * table-only tournaments have no single decider, so they're "finished"
 * with no named champion.
 */
export async function getTournamentStatus(tournament: {
  id: string;
  knockoutFormat: "NONE" | "FINAL" | "SEMI_FINAL";
  groupCount: number;
}): Promise<TournamentStatus> {
  if (tournament.knockoutFormat !== "NONE") {
    const final = await prisma.match.findFirst({
      where: { tournamentId: tournament.id, stage: "FINAL" },
      include: {
        homeUser: { select: { teamName: true } },
        awayUser: { select: { teamName: true } },
      },
    });

    if (!final || final.status !== "APPROVED" || final.homeScore == null || final.awayScore == null) {
      return { finished: false, championTeamName: null };
    }

    const championTeamName =
      final.homeScore > final.awayScore ? final.homeUser.teamName : final.awayUser.teamName;
    return { finished: true, championTeamName };
  }

  const [totalCount, unplayedCount] = await Promise.all([
    prisma.match.count({ where: { tournamentId: tournament.id } }),
    prisma.match.count({ where: { tournamentId: tournament.id, status: { not: "APPROVED" } } }),
  ]);

  if (totalCount === 0 || unplayedCount > 0) {
    return { finished: false, championTeamName: null };
  }

  if (tournament.groupCount > 1) {
    return { finished: true, championTeamName: null };
  }

  const standings = await computeStandings(tournament.id);
  return { finished: true, championTeamName: standings[0]?.teamName ?? null };
}
