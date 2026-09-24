"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResultForm({
  matchId,
  initialHome,
  initialAway,
  isAdmin,
}: {
  matchId: string;
  initialHome: number | null;
  initialAway: number | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState(initialHome ?? 0);
  const [awayScore, setAwayScore] = useState(initialAway ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/matches/${matchId}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeScore, awayScore }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not submit result");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={99}
        value={homeScore}
        onChange={(e) => setHomeScore(Number(e.target.value))}
        className="input w-14 text-center px-2 py-1"
      />
      <span className="text-[var(--muted)]">-</span>
      <input
        type="number"
        min={0}
        max={99}
        value={awayScore}
        onChange={(e) => setAwayScore(Number(e.target.value))}
        className="input w-14 text-center px-2 py-1"
      />
      <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
        {submitting ? "Saving..." : isAdmin ? "Save" : "Submit"}
      </button>
      {error && <span className="text-xs text-[var(--loss)]">{error}</span>}
    </form>
  );
}
