import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUpcomingMatches, getRecentResults } from "@/lib/myMatches";
import { getTournamentStatus, type TournamentStatus } from "@/lib/tournamentStatus";

function StageBadge({ stage }: { stage: string }) {
  if (stage === "GROUP") return null;
  const label = stage === "SEMI_FINAL" ? "Semi-final" : stage === "THIRD_PLACE" ? "3rd place" : "Final";
  return <span className="badge badge-brand">{label}</span>;
}

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) return null; // middleware redirects to /login

  const userId = session.user.id;

  const [tournaments, upcoming, recent] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { entries: true, matches: true } } },
    }),
    getUpcomingMatches(userId, 5),
    getRecentResults(userId, 5),
  ]);

  const statuses = await Promise.all(tournaments.map((t) => getTournamentStatus(t)));
  const tournamentsWithStatus = tournaments.map((t, i) => ({ ...t, status: statuses[i] }));
  const ongoingTournaments = tournamentsWithStatus.filter((t) => !t.status.finished);
  const finishedTournaments = tournamentsWithStatus.filter((t) => t.status.finished);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="section-title">My upcoming matches</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No upcoming matches scheduled.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((m) => {
              const opponent = m.homeUserId === userId ? m.awayUser : m.homeUser;
              return (
                <li key={m.id} className="card p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={opponent.photoUrl || "/default-avatar.svg"}
                      alt={opponent.teamName}
                      width={32}
                      height={32}
                      unoptimized
                      className="avatar w-8 h-8"
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate">vs {opponent.teamName}</div>
                      <div className="text-xs text-[var(--muted)] truncate">
                        {m.tournament.name}
                        {m.scheduledDate &&
                          ` · ${new Date(m.scheduledDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StageBadge stage={m.stage} />
                    <Link href={`/compare?a=${userId}&b=${opponent.id}`} className="btn btn-secondary btn-sm">
                      Head to head
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="section-title">My recent results</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No results yet.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((m) => {
              const opponent = m.homeUserId === userId ? m.awayUser : m.homeUser;
              const myScore = m.homeUserId === userId ? m.homeScore! : m.awayScore!;
              const theirScore = m.homeUserId === userId ? m.awayScore! : m.homeScore!;
              const outcome = myScore > theirScore ? "W" : myScore < theirScore ? "L" : "D";
              const badgeClass =
                outcome === "W" ? "badge-win" : outcome === "L" ? "badge-loss" : "badge-draw";

              return (
                <li key={m.id} className="card p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={opponent.photoUrl || "/default-avatar.svg"}
                      alt={opponent.teamName}
                      width={32}
                      height={32}
                      unoptimized
                      className="avatar w-8 h-8"
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        vs {opponent.teamName} <span className="text-[var(--muted)]">({myScore}-{theirScore})</span>
                      </div>
                      <div className="text-xs text-[var(--muted)] truncate">{m.tournament.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge ${badgeClass}`}>{outcome}</span>
                    <Link href={`/compare?a=${userId}&b=${opponent.id}`} className="btn btn-secondary btn-sm">
                      Head to head
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Tournaments</h2>
          {session.user.role === "ADMIN" && (
            <Link href="/tournaments/new" className="btn btn-primary">
              + New tournament
            </Link>
          )}
        </div>

        {tournaments.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No tournaments yet.</p>
        ) : (
          <div className="space-y-6">
            {ongoingTournaments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Ongoing
                </h3>
                <TournamentGrid tournaments={ongoingTournaments} />
              </div>
            )}

            {finishedTournaments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Finished
                </h3>
                <TournamentGrid tournaments={finishedTournaments} />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function TournamentGrid({
  tournaments,
}: {
  tournaments: {
    id: string;
    name: string;
    status: TournamentStatus;
    _count: { entries: number; matches: number };
  }[];
}) {
  return (
    <ul className="grid sm:grid-cols-2 gap-3">
      {tournaments.map((t) => (
        <li key={t.id}>
          <Link href={`/tournaments/${t.id}`} className="card card-hover block p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">{t.name}</div>
              {t.status.finished && <span className="badge badge-win shrink-0">Finished</span>}
            </div>
            <div className="text-sm text-[var(--muted)]">
              {t._count.entries} teams · {t._count.matches} matches
            </div>
            {t.status.championTeamName && (
              <div className="text-sm font-medium mt-1" style={{ color: "var(--pending)" }}>
                🏆 {t.status.championTeamName}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
