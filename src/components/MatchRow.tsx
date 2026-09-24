import Image from "next/image";
import ResultForm from "@/components/ResultForm";

type MatchTeam = { id: string; teamName: string; photoUrl: string };

export type MatchRowData = {
  id: string;
  status: "SCHEDULED" | "PENDING_APPROVAL" | "APPROVED";
  homeScore: number | null;
  awayScore: number | null;
  pendingHomeScore: number | null;
  pendingAwayScore: number | null;
  scheduledDate: Date | string | null;
  homeUser: MatchTeam;
  awayUser: MatchTeam;
};

function formatDate(d: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function MatchRow({
  match,
  currentUserId,
  isAdmin,
  emphasized = false,
}: {
  match: MatchRowData;
  currentUserId?: string;
  isAdmin: boolean;
  emphasized?: boolean;
}) {
  const canSubmit =
    isAdmin || match.homeUser.id === currentUserId || match.awayUser.id === currentUserId;
  const showForm = canSubmit && (match.status !== "PENDING_APPROVAL" || isAdmin);
  const date = formatDate(match.scheduledDate);

  return (
    <div
      className={`card flex flex-wrap items-center justify-between gap-3 p-3 ${
        emphasized ? "border-[var(--brand)]" : ""
      }`}
    >
      <div className="flex items-center gap-3 text-sm min-w-0">
        <TeamTag team={match.homeUser} />
        <span className="text-[var(--muted)] text-xs shrink-0">vs</span>
        <TeamTag team={match.awayUser} />

        {match.status === "APPROVED" && (
          <span className="badge badge-win shrink-0">
            {match.homeScore} - {match.awayScore}
          </span>
        )}
        {match.status === "PENDING_APPROVAL" && (
          <span className="badge badge-pending shrink-0">
            Pending: {match.pendingHomeScore} - {match.pendingAwayScore}
          </span>
        )}
        {match.status === "SCHEDULED" && date && (
          <span className="badge badge-draw shrink-0">{date}</span>
        )}
      </div>

      {showForm && (
        <ResultForm
          matchId={match.id}
          initialHome={match.homeScore}
          initialAway={match.awayScore}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

function TeamTag({ team }: { team: MatchTeam }) {
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      <Image
        src={team.photoUrl || "/default-avatar.svg"}
        alt={team.teamName}
        width={22}
        height={22}
        unoptimized
        className="avatar w-[22px] h-[22px]"
      />
      <span className="font-medium truncate">{team.teamName}</span>
    </span>
  );
}
