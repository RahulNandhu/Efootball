"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RoleToggle({
  userId,
  role,
}: {
  userId: string;
  role: "ADMIN" | "USER";
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setSubmitting(true);
    setError(null);

    const nextRole = role === "ADMIN" ? "USER" : "ADMIN";
    const res = await fetch(`/api/users/${userId}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not update role");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <button onClick={toggle} disabled={submitting} className="btn btn-secondary btn-sm">
        {submitting ? "Updating..." : role === "ADMIN" ? "Demote to user" : "Promote to admin"}
      </button>
      {error && <span className="text-xs text-[var(--loss)]">{error}</span>}
    </div>
  );
}
