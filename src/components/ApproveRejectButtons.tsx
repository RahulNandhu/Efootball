"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveRejectButtons({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(action: "approve" | "reject") {
    setSubmitting(action);
    setError(null);

    const res = await fetch(`/api/matches/${matchId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(null);

    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => review("approve")} disabled={submitting !== null} className="btn btn-success btn-sm">
        {submitting === "approve" ? "Approving..." : "Approve"}
      </button>
      <button onClick={() => review("reject")} disabled={submitting !== null} className="btn btn-danger btn-sm">
        {submitting === "reject" ? "Rejecting..." : "Reject"}
      </button>
      {error && <span className="text-xs text-[var(--loss)]">{error}</span>}
    </div>
  );
}
