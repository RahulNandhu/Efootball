"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (res?.error) {
      setError("Invalid username or password");
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="label">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          className="input"
          autoCapitalize="none"
          required
        />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          required
        />
      </div>

      {error && <p className="text-sm text-[var(--loss)]">{error}</p>}

      <button type="submit" disabled={submitting} className="btn btn-primary w-full">
        {submitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
