"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserOption = { id: string; username: string; teamName: string };

export default function CreateTournamentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [legType, setLegType] = useState<"SINGLE" | "DOUBLE">("SINGLE");
  const [groupCount, setGroupCount] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [knockoutFormat, setKnockoutFormat] = useState<"NONE" | "FINAL" | "SEMI_FINAL">("NONE");
  const [hasThirdPlace, setHasThirdPlace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => setError("Could not load registered users"));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selected.size < 2) {
      setError("Select at least 2 players");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        userIds: Array.from(selected),
        legType,
        groupCount,
        startDate,
        knockoutFormat,
        hasThirdPlace,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create tournament");
      return;
    }

    router.push(`/tournaments/${data.id}`);
  }

  const maxGroups = Math.max(1, Math.floor(selected.size / 2));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <label className="label">Tournament name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
      </div>

      <div>
        <label className="label">Players ({selected.size} selected)</label>
        <div className="max-h-64 overflow-y-auto card divide-y" style={{ borderColor: "var(--border)" }}>
          {users.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[var(--surface-muted)]"
            >
              <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
              <span className="font-medium">{u.teamName}</span>
              <span className="text-[var(--muted)]">@{u.username}</span>
            </label>
          ))}
          {users.length === 0 && (
            <p className="px-3 py-4 text-sm text-[var(--muted)]">No registered users yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Format</label>
          <select
            value={legType}
            onChange={(e) => setLegType(e.target.value as "SINGLE" | "DOUBLE")}
            className="input"
          >
            <option value="SINGLE">Single round robin</option>
            <option value="DOUBLE">Double round robin (home &amp; away)</option>
          </select>
        </div>

        <div>
          <label className="label">Groups</label>
          <select
            value={groupCount}
            onChange={(e) => setGroupCount(Number(e.target.value))}
            className="input"
          >
            <option value={1}>No groups (single league)</option>
            {Array.from({ length: Math.max(0, maxGroups - 1) }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n}>
                {n} groups (random draw)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
          <p className="text-xs text-[var(--muted)] mt-1">
            Fixtures are auto-scheduled from this date, one match per team per day.
          </p>
        </div>

        <div>
          <label className="label">Knockout stage</label>
          <select
            value={knockoutFormat}
            onChange={(e) => setKnockoutFormat(e.target.value as "NONE" | "FINAL" | "SEMI_FINAL")}
            className="input"
          >
            <option value="NONE">None — table only</option>
            <option value="FINAL">Top 2 go straight to a final</option>
            <option value="SEMI_FINAL">Top 4 to semi-finals (1v4, 2v3)</option>
          </select>
        </div>
      </div>

      {knockoutFormat === "SEMI_FINAL" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hasThirdPlace}
            onChange={(e) => setHasThirdPlace(e.target.checked)}
          />
          Include a 3rd place play-off
        </label>
      )}

      {error && <p className="text-sm text-[var(--loss)]">{error}</p>}

      <button type="submit" disabled={submitting} className="btn btn-primary">
        {submitting ? "Creating..." : "Create tournament"}
      </button>
    </form>
  );
}
