import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ApproveRejectButtons from "@/components/ApproveRejectButtons";

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const pending = await prisma.match.findMany({
    where: { status: "PENDING_APPROVAL" },
    include: {
      tournament: { select: { name: true } },
      homeUser: { select: { teamName: true } },
      awayUser: { select: { teamName: true } },
      submittedBy: { select: { username: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h1 className="page-title mb-6">Pending approvals</h1>

      {pending.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nothing waiting for approval.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((m) => (
            <li key={m.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="text-sm">
                <div className="text-[var(--muted)]">{m.tournament.name}</div>
                <div className="font-medium">
                  {m.homeUser.teamName} {m.pendingHomeScore} - {m.pendingAwayScore}{" "}
                  {m.awayUser.teamName}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  Submitted by @{m.submittedBy?.username ?? "unknown"}
                </div>
              </div>
              <ApproveRejectButtons matchId={m.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
