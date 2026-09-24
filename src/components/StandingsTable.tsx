import Image from "next/image";
import LastFive from "@/components/LastFive";
import type { StandingRow } from "@/lib/standings";

export default function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="table-clean">
        <thead>
          <tr>
            <th>Team</th>
            <th className="text-center">P</th>
            <th className="text-center">W</th>
            <th className="text-center">D</th>
            <th className="text-center">L</th>
            <th className="text-center">GF</th>
            <th className="text-center">GA</th>
            <th className="text-center">GD</th>
            <th className="text-center">Pts</th>
            <th>Last 5</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.userId}>
              <td>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted)] w-4 text-right shrink-0">{i + 1}</span>
                  <Image
                    src={row.photoUrl || "/default-avatar.svg"}
                    alt={row.teamName}
                    width={28}
                    height={28}
                    unoptimized
                    className="avatar w-7 h-7"
                  />
                  <span className="font-medium">{row.teamName}</span>
                </div>
              </td>
              <td className="text-center">{row.played}</td>
              <td className="text-center">{row.won}</td>
              <td className="text-center">{row.draw}</td>
              <td className="text-center">{row.loss}</td>
              <td className="text-center">{row.goalsFor}</td>
              <td className="text-center">{row.goalsAgainst}</td>
              <td className="text-center">{row.goalDiff}</td>
              <td className="text-center font-bold text-[var(--brand)]">{row.points}</td>
              <td>
                <LastFive results={row.last5} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={10} className="text-center text-[var(--muted)] py-6">
                No teams yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
