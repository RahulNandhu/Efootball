import type { Prisma, LegType } from "@prisma/client";
import { generateFixtures, drawGroups, addDays } from "@/lib/scheduling";

/**
 * Draws groups (if any) and generates the group-stage fixture list for a
 * tournament, inside an existing transaction. Shared by tournament create
 * and full-edit (which wipes and regenerates when no results exist yet).
 */
export async function createGroupsAndFixtures(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  params: { userIds: string[]; legType: LegType; groupCount: number; startDate: Date }
) {
  const { userIds, legType, groupCount, startDate } = params;

  const groupedTeamIds = groupCount > 1 ? drawGroups(userIds, groupCount) : [userIds];
  const groupNames = groupedTeamIds.map((_, i) =>
    groupCount > 1 ? `Group ${String.fromCharCode(65 + i)}` : "League"
  );

  for (let g = 0; g < groupedTeamIds.length; g++) {
    const teamIds = groupedTeamIds[g];
    if (teamIds.length === 0) continue;

    const group =
      groupCount > 1
        ? await tx.group.create({ data: { tournamentId, name: groupNames[g] } })
        : null;

    await tx.tournamentEntry.createMany({
      data: teamIds.map((userId) => ({ tournamentId, userId, groupId: group?.id })),
    });

    const fixtures = generateFixtures(teamIds, legType);
    if (fixtures.length > 0) {
      await tx.match.createMany({
        data: fixtures.map((f) => ({
          tournamentId,
          groupId: group?.id,
          stage: "GROUP" as const,
          round: f.round,
          homeUserId: f.homeId,
          awayUserId: f.awayId,
          scheduledDate: addDays(startDate, f.round - 1),
        })),
      });
    }
  }
}
