import { prisma } from "@/lib/prisma";

export type StandingRow = {
  userId: string;
  teamName: string;
  photoUrl: string;
  played: number;
  won: number;
  draw: number;
  loss: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  last5: ("W" | "D" | "L")[];
};

function buildTable(
  entries: { userId: string; user: { teamName: string; photoUrl: string } }[],
  matches: { homeUserId: string; awayUserId: string; homeScore: number | null; awayScore: number | null }[]
): StandingRow[] {
  const table = new Map<string, StandingRow>();
  for (const entry of entries) {
    table.set(entry.userId, {
      userId: entry.userId,
      teamName: entry.user.teamName,
      photoUrl: entry.user.photoUrl,
      played: 0,
      won: 0,
      draw: 0,
      loss: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      last5: [],
    });
  }

  const recentResults = new Map<string, ("W" | "D" | "L")[]>();

  for (const match of matches) {
    if (match.homeScore == null || match.awayScore == null) continue;

    const home = table.get(match.homeUserId);
    const away = table.get(match.awayUserId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    let homeResult: "W" | "D" | "L";
    let awayResult: "W" | "D" | "L";

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      home.points += 3;
      away.loss += 1;
      homeResult = "W";
      awayResult = "L";
    } else if (match.homeScore < match.awayScore) {
      away.won += 1;
      away.points += 3;
      home.loss += 1;
      homeResult = "L";
      awayResult = "W";
    } else {
      home.draw += 1;
      away.draw += 1;
      home.points += 1;
      away.points += 1;
      homeResult = "D";
      awayResult = "D";
    }

    recentResults.set(match.homeUserId, [...(recentResults.get(match.homeUserId) ?? []), homeResult]);
    recentResults.set(match.awayUserId, [...(recentResults.get(match.awayUserId) ?? []), awayResult]);
  }

  for (const [userId, row] of table) {
    row.goalDiff = row.goalsFor - row.goalsAgainst;
    row.last5 = (recentResults.get(userId) ?? []).slice(-5).reverse();
  }

  return Array.from(table.values()).sort(
    (a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor
  );
}

/**
 * League-stage standings only (MatchStage.GROUP) — knockout matches never
 * count toward the point table. Pass `groupId` to scope to one group;
 * omit it for the whole tournament (groupless tournaments, or a combined
 * view across all groups).
 */
export async function computeStandings(tournamentId: string, groupId?: string): Promise<StandingRow[]> {
  const [entries, matches] = await Promise.all([
    prisma.tournamentEntry.findMany({
      where: { tournamentId, ...(groupId ? { groupId } : {}) },
      include: { user: true },
    }),
    prisma.match.findMany({
      // Not filtered to status APPROVED: a match awaiting a player-submitted
      // correction (PENDING_APPROVAL) still holds its last-approved score in
      // homeScore/awayScore, which should keep counting until the admin acts.
      where: { tournamentId, stage: "GROUP", ...(groupId ? { groupId } : {}) },
      orderBy: { playedAt: "asc" },
    }),
  ]);

  return buildTable(entries, matches);
}

export type QualifierRow = StandingRow & { groupName: string | null; groupRank: number };

/**
 * Ranks teams for knockout seeding. Groupless tournaments: plain league
 * order. Multi-group tournaments: all group winners first (ordered among
 * themselves by points/GD/GF), then all runners-up, and so on — the
 * standard "best of each position across groups" approach.
 */
export async function getQualifiers(tournamentId: string, count: number): Promise<QualifierRow[]> {
  const groups = await prisma.group.findMany({ where: { tournamentId }, orderBy: { name: "asc" } });

  if (groups.length === 0) {
    const standings = await computeStandings(tournamentId);
    return standings.slice(0, count).map((row, i) => ({ ...row, groupName: null, groupRank: i }));
  }

  const perGroup = await Promise.all(
    groups.map(async (g) => ({ group: g, standings: await computeStandings(tournamentId, g.id) }))
  );

  const maxSize = Math.max(...perGroup.map((g) => g.standings.length));
  const ranked: QualifierRow[] = [];

  for (let rank = 0; rank < maxSize; rank++) {
    const atThisRank = perGroup
      .filter((g) => g.standings[rank])
      .map((g) => ({ ...g.standings[rank], groupName: g.group.name, groupRank: rank }))
      .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
    ranked.push(...atThisRank);
  }

  return ranked.slice(0, count);
}
