"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteUserButton({ userId, teamName }: { userId: string; teamName: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(`Delete "${teamName}"? This can't be undone.`)) return;

    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not delete user");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleDelete} disabled={submitting} className="btn btn-danger btn-sm">
        {submitting ? "Deleting..." : "Delete"}
      </button>
      {error && <span className="text-xs text-[var(--loss)]">{error}</span>}
    </div>
  );
}
