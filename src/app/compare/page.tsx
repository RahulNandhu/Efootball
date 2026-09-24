import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getHeadToHead, getCommonOpponents, type Record_ } from "@/lib/headToHead";
import CompareForm from "@/components/CompareForm";

function RecordStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{label}</div>
    </div>
  );
}

function MiniRecord({ record }: { record: Record_ }) {
  return (
    <span className="text-xs text-[var(--muted)]">
      {record.played}P · {record.won}W {record.draw}D {record.loss}L · {record.goalsFor}-{record.goalsAgainst}
    </span>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { a, b } = await searchParams;

  let teamA: { id: string; teamName: string; photoUrl: string } | null = null;
  let teamB: { id: string; teamName: string; photoUrl: string } | null = null;

  if (a && b && a !== b) {
    const [ua, ub] = await Promise.all([
      prisma.user.findUnique({ where: { id: a }, select: { id: true, teamName: true, photoUrl: true } }),
      prisma.user.findUnique({ where: { id: b }, select: { id: true, teamName: true, photoUrl: true } }),
    ]);
    teamA = ua;
    teamB = ub;
  }

  const data = teamA && teamB ? await getHeadToHead(teamA.id, teamB.id) : null;
  const commonOpponents = teamA && teamB ? await getCommonOpponents(teamA.id, teamB.id) : [];

  return (
    <div className="space-y-6">
      <h1 className="page-title">Compare teams</h1>
      <CompareForm initialA={teamA?.id} initialB={teamB?.id} />

      {teamA && teamB && data && (
        <>
          <div className="card p-5 flex items-center justify-center gap-8 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <Image
                src={teamA.photoUrl || "/default-avatar.svg"}
                alt={teamA.teamName}
                width={56}
                height={56}
                unoptimized
                className="avatar w-14 h-14"
              />
              <span className="font-semibold">{teamA.teamName}</span>
            </div>

            <div className="flex items-center gap-6">
              <RecordStat label="Wins" value={data.recordA.won} />
              <RecordStat label="Draws" value={data.recordA.draw} />
              <RecordStat label="Wins" value={data.recordB.won} />
            </div>

            <div className="flex flex-col items-center gap-2">
              <Image
                src={teamB.photoUrl || "/default-avatar.svg"}
                alt={teamB.teamName}
                width={56}
                height={56}
                unoptimized
                className="avatar w-14 h-14"
              />
              <span className="font-semibold">{teamB.teamName}</span>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="section-title">Past meetings ({data.meetings.length})</h2>
            {data.meetings.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">These teams haven&apos;t played each other yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.meetings.map((m) => (
                  <li key={m.matchId} className="card p-3 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-medium">
                        {m.homeUserId === teamA.id ? teamA.teamName : teamB.teamName} {m.homeScore} -{" "}
                        {m.awayScore} {m.awayUserId === teamB.id ? teamB.teamName : teamA.teamName}
                      </div>
                      <div className="text-xs text-[var(--muted)]">{m.tournamentName}</div>
                    </div>
                    <span className="text-xs text-[var(--muted)] shrink-0">
                      {m.playedAt ? new Date(m.playedAt).toLocaleDateString() : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="section-title">Common opponents ({commonOpponents.length})</h2>
            {commonOpponents.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No shared opponents yet.</p>
            ) : (
              <div className="card overflow-x-auto">
                <table className="table-clean">
                  <thead>
                    <tr>
                      <th>Opponent</th>
                      <th>{teamA.teamName}</th>
                      <th>{teamB.teamName}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commonOpponents.map((row) => (
                      <tr key={row.opponent.userId}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Image
                              src={row.opponent.photoUrl || "/default-avatar.svg"}
                              alt={row.opponent.teamName}
                              width={24}
                              height={24}
                              unoptimized
                              className="avatar w-6 h-6"
                            />
                            <span className="font-medium">{row.opponent.teamName}</span>
                          </div>
                        </td>
                        <td>
                          <MiniRecord record={row.recordA} />
                        </td>
                        <td>
                          <MiniRecord record={row.recordB} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
