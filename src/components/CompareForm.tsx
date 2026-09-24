"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserOption = { id: string; teamName: string; username: string };

export default function CompareForm({
  initialA,
  initialB,
}: {
  initialA?: string;
  initialB?: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [a, setA] = useState(initialA ?? "");
  const [b, setB] = useState(initialB ?? "");

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b || a === b) return;
    router.push(`/compare?a=${a}&b=${b}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="label">Team A</label>
        <select value={a} onChange={(e) => setA(e.target.value)} className="input" required>
          <option value="" disabled>
            Select a team
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id} disabled={u.id === b}>
              {u.teamName}
            </option>
          ))}
        </select>
      </div>

      <span className="text-[var(--muted)] pb-2">vs</span>

      <div>
        <label className="label">Team B</label>
        <select value={b} onChange={(e) => setB(e.target.value)} className="input" required>
          <option value="" disabled>
            Select a team
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id} disabled={u.id === a}>
              {u.teamName}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary" disabled={!a || !b || a === b}>
        Compare
      </button>
    </form>
  );
}
