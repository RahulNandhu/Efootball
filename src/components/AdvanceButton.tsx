"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdvanceButton({ tournamentId, label }: { tournamentId: string; label: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/tournaments/${tournamentId}/advance`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not advance the tournament");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleClick} disabled={submitting} className="btn btn-primary btn-sm">
        {submitting ? "Working..." : label}
      </button>
      {error && <span className="text-xs text-[var(--loss)]">{error}</span>}
    </div>
  );
}
