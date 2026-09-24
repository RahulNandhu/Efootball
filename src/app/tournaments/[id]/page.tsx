import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeStandings } from "@/lib/standings";
import StandingsTable from "@/components/StandingsTable";
import MatchRow, { type MatchRowData } from "@/components/MatchRow";
import AdvanceButton from "@/components/AdvanceButton";

const STAGE_LABEL: Record<string, string> = {
  SEMI_FINAL: "Semi-final",
  THIRD_PLACE: "3rd place play-off",
  FINAL: "Final",
};

function groupByRound<T extends MatchRowData & { round: number }>(matches: T[]) {
  const map = new Map<number, T[]>();
  for (const m of matches) {
    const list = map.get(m.round) ?? [];
    list.push(m);
    map.set(m.round, list);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      groups: { orderBy: { name: "asc" } },
      matches: {
        include: {
          homeUser: { select: { id: true, teamName: true, photoUrl: true } },
          awayUser: { select: { id: true, teamName: true, photoUrl: true } },
        },
        orderBy: [{ round: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!tournament) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const hasGroups = tournament.groups.length > 0;

  const sections = hasGroups
    ? await Promise.all(
        tournament.groups.map(async (g) => ({
          key: g.id,
          title: g.name,
          standings: await computeStandings(id, g.id),
          matches: tournament.matches.filter((m) => m.stage === "GROUP" && m.groupId === g.id),
        }))
      )
    : [
        {
          key: "all",
          title: "Table",
          standings: await computeStandings(id),
          matches: tournament.matches.filter((m) => m.stage === "GROUP"),
        },
      ];

  const semis = tournament.matches.filter((m) => m.stage === "SEMI_FINAL").sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  const final = tournament.matches.find((m) => m.stage === "FINAL");
  const thirdPlace = tournament.matches.find((m) => m.stage === "THIRD_PLACE");
  const knockoutMatches = [...semis, thirdPlace, final].filter((m): m is NonNullable<typeof m> => Boolean(m));

  let advanceAction: { label: string } | null = null;
  let advanceNote: string | null = null;

  if (tournament.knockoutFormat === "FINAL" && !final) {
    advanceAction = { label: "Generate final" };
  } else if (tournament.knockoutFormat === "SEMI_FINAL" && !final) {
    if (semis.length === 0) {
      advanceAction = { label: "Draw semi-finals" };
    } else if (semis.every((m) => m.status === "APPROVED")) {
      advanceAction = { label: "Advance to final" + (tournament.hasThirdPlace ? " & 3rd place" : "") };
    } else {
      advanceNote = "Waiting for both semi-final results to be approved.";
    }
  }

  const formatLabel = tournament.legType === "DOUBLE" ? "Double round robin" : "Single round robin";
  const knockoutLabel =
    tournament.knockoutFormat === "SEMI_FINAL"
      ? "Semi-finals" + (tournament.hasThirdPlace ? " + 3rd place" : "")
      : tournament.knockoutFormat === "FINAL"
        ? "Final"
        : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">{tournament.name}</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="badge badge-brand">{formatLabel}</span>
          {hasGroups && <span className="badge badge-brand">{tournament.groups.length} groups</span>}
          {knockoutLabel && <span className="badge badge-brand">{knockoutLabel}</span>}
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.key} className="space-y-3">
          <h2 className="section-title">{section.title}</h2>
          <StandingsTable rows={section.standings} />

          {groupByRound(section.matches).map(([round, matches]) => (
            <div key={round} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Matchday {round}
                {matches[0]?.scheduledDate &&
                  ` · ${new Date(matches[0].scheduledDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}`}
              </p>
              <div className="space-y-2">
                {matches.map((m) => (
                  <MatchRow key={m.id} match={m} currentUserId={session.user.id} isAdmin={isAdmin} />
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}

      {tournament.knockoutFormat !== "NONE" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="section-title">Knockout stage</h2>
            {isAdmin && advanceAction && (
              <AdvanceButton tournamentId={id} label={advanceAction.label} />
            )}
          </div>

          {advanceNote && <p className="text-sm text-[var(--muted)]">{advanceNote}</p>}

          {knockoutMatches.length === 0 && !advanceAction && (
            <p className="text-sm text-[var(--muted)]">
              Not started yet — finish the table, then an admin can advance the tournament.
            </p>
          )}

          <div className="space-y-3">
            {knockoutMatches.map((m) => (
              <div key={m.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">
                  {STAGE_LABEL[m.stage]}
                  {m.stage === "SEMI_FINAL" ? ` ${m.slot}` : ""}
                </p>
                <MatchRow match={m as MatchRowData} currentUserId={session.user.id} isAdmin={isAdmin} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
