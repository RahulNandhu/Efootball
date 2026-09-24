const BYE = "__BYE__";

export type Fixture = { round: number; homeId: string; awayId: string };

/**
 * Classic circle-method round robin: N-1 rounds for even N (N rounds for odd N,
 * with one team on a bye each round), each team playing at most once per round.
 */
function singleRoundRobin(teamIds: string[]): Fixture[] {
  const ids = [...teamIds];
  if (ids.length % 2 !== 0) ids.push(BYE);

  const n = ids.length;
  const fixed = ids[0];
  const rotating = ids.slice(1);
  const fixtures: Fixture[] = [];

  for (let round = 0; round < n - 1; round++) {
    const lineup = [fixed, ...rotating];
    for (let i = 0; i < n / 2; i++) {
      const a = lineup[i];
      const b = lineup[n - 1 - i];
      if (a === BYE || b === BYE) continue;
      // Alternate which side is "home" pairing-by-pairing so it isn't always
      // the same team listed first every round.
      const [homeId, awayId] = i % 2 === 0 ? [a, b] : [b, a];
      fixtures.push({ round: round + 1, homeId, awayId });
    }
    rotating.unshift(rotating.pop()!);
  }

  return fixtures;
}

export function generateFixtures(teamIds: string[], legType: "SINGLE" | "DOUBLE"): Fixture[] {
  if (teamIds.length < 2) return [];

  const firstLeg = singleRoundRobin(teamIds);
  if (legType === "SINGLE") return firstLeg;

  const roundsInFirstLeg = firstLeg.length > 0 ? Math.max(...firstLeg.map((f) => f.round)) : 0;
  const secondLeg = firstLeg.map((f) => ({
    round: f.round + roundsInFirstLeg,
    homeId: f.awayId,
    awayId: f.homeId,
  }));

  return [...firstLeg, ...secondLeg];
}

/** Random draw of teams into `groupCount` groups, as evenly sized as possible. */
export function drawGroups<T>(teamIds: T[], groupCount: number): T[][] {
  const shuffled = [...teamIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const groups: T[][] = Array.from({ length: groupCount }, () => []);
  shuffled.forEach((id, i) => groups[i % groupCount].push(id));
  return groups;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
