import { prisma } from "@/lib/prisma";

export type TeamRef = { userId: string; teamName: string; photoUrl: string };

export type Meeting = {
  matchId: string;
  tournamentName: string;
  stage: string;
  playedAt: Date | null;
  scheduledDate: Date | null;
  homeUserId: string;
  awayUserId: string;
  homeScore: number;
  awayScore: number;
};

export type Record_ = { played: number; won: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number };

function emptyRecord(): Record_ {
  return { played: 0, won: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0 };
}

function applyMeeting(record: Record_, selfId: string, m: Meeting) {
  const selfIsHome = m.homeUserId === selfId;
  const forGoals = selfIsHome ? m.homeScore : m.awayScore;
  const againstGoals = selfIsHome ? m.awayScore : m.homeScore;

  record.played += 1;
  record.goalsFor += forGoals;
  record.goalsAgainst += againstGoals;
  if (forGoals > againstGoals) record.won += 1;
  else if (forGoals < againstGoals) record.loss += 1;
  else record.draw += 1;
}

async function playedMatchesFor(userId: string) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homeUserId: userId }, { awayUserId: userId }],
      homeScore: { not: null },
      awayScore: { not: null },
    },
    include: { tournament: { select: { name: true } } },
    orderBy: [{ playedAt: "desc" }, { createdAt: "desc" }],
  });

  return matches.map(
    (m): Meeting => ({
      matchId: m.id,
      tournamentName: m.tournament.name,
      stage: m.stage,
      playedAt: m.playedAt,
      scheduledDate: m.scheduledDate,
      homeUserId: m.homeUserId,
      awayUserId: m.awayUserId,
      homeScore: m.homeScore!,
      awayScore: m.awayScore!,
    })
  );
}

export async function getHeadToHead(userIdA: string, userIdB: string) {
  const matches = await playedMatchesFor(userIdA);
  const meetings = matches.filter(
    (m) =>
      (m.homeUserId === userIdA && m.awayUserId === userIdB) ||
      (m.homeUserId === userIdB && m.awayUserId === userIdA)
  );

  const recordA = emptyRecord();
  const recordB = emptyRecord();
  for (const m of meetings) {
    applyMeeting(recordA, userIdA, m);
    applyMeeting(recordB, userIdB, m);
  }

  return { meetings, recordA, recordB };
}

export type CommonOpponentRow = {
  opponent: TeamRef;
  recordA: Record_;
  recordB: Record_;
};

export async function getCommonOpponents(userIdA: string, userIdB: string): Promise<CommonOpponentRow[]> {
  const [matchesA, matchesB] = await Promise.all([playedMatchesFor(userIdA), playedMatchesFor(userIdB)]);

  const opponentOf = (selfId: string, m: Meeting) => (m.homeUserId === selfId ? m.awayUserId : m.homeUserId);

  const opponentsA = new Set(matchesA.filter((m) => opponentOf(userIdA, m) !== userIdB).map((m) => opponentOf(userIdA, m)));
  const opponentsB = new Set(matchesB.filter((m) => opponentOf(userIdB, m) !== userIdA).map((m) => opponentOf(userIdB, m)));

  const common = [...opponentsA].filter((id) => opponentsB.has(id));
  if (common.length === 0) return [];

  const opponentUsers = await prisma.user.findMany({
    where: { id: { in: common } },
    select: { id: true, teamName: true, photoUrl: true },
  });
  const byId = new Map(opponentUsers.map((u) => [u.id, u]));

  return common
    .map((opponentId) => {
      const recordA = emptyRecord();
      const recordB = emptyRecord();
      for (const m of matchesA) if (opponentOf(userIdA, m) === opponentId) applyMeeting(recordA, userIdA, m);
      for (const m of matchesB) if (opponentOf(userIdB, m) === opponentId) applyMeeting(recordB, userIdB, m);

      const user = byId.get(opponentId);
      return {
        opponent: { userId: opponentId, teamName: user?.teamName ?? "Unknown", photoUrl: user?.photoUrl ?? "" },
        recordA,
        recordB,
      };
    })
    .sort((a, b) => a.opponent.teamName.localeCompare(b.opponent.teamName));
}
