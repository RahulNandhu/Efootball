"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordButton({ userId, teamName }: { userId: string; teamName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/users/${userId}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not reset password");
      return;
    }

    setSuccess(true);
    setNewPassword("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          setSuccess(false);
        }}
        className="btn btn-secondary btn-sm"
      >
        Reset password
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder={`New password for ${teamName}`}
        className="input py-1 px-2 text-sm w-44"
        minLength={6}
        required
        autoFocus
      />
      <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
        {submitting ? "Saving..." : "Set"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setError(null);
          setNewPassword("");
        }}
        className="btn btn-secondary btn-sm"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-[var(--loss)]">{error}</span>}
      {success && <span className="text-xs text-[var(--win)]">Password updated</span>}
    </form>
  );
}
