"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!photo) {
      setError("A profile photo is required");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.set("username", username);
    formData.set("password", password);
    formData.set("teamName", teamName);
    formData.set("photo", photo);

    const res = await fetch("/api/register", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));

    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      return;
    }

    router.push("/login");
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
        <label className="label">Team name</label>
        <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="input" required />
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
      <div>
        <label className="label">Profile photo (required)</label>
        <label
          htmlFor="photo-upload"
          className="group relative flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-colors hover:border-[var(--brand)]"
          style={{ borderColor: preview ? "transparent" : "var(--border)", background: "var(--surface-muted)" }}
        >
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent group-hover:bg-black/50 group-hover:text-white text-xs font-semibold transition-colors">
                Change photo
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-center px-2">
              <span className="text-2xl">📷</span>
              <span className="text-xs font-semibold text-[var(--brand)]">Click to upload</span>
            </div>
          )}
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={onPhotoChange}
            required
            className="sr-only"
          />
        </label>
        <p className="text-xs text-[var(--muted)] mt-2">Automatically compressed to under 100KB after upload.</p>
      </div>

      {error && <p className="text-sm text-[var(--loss)]">{error}</p>}

      <button type="submit" disabled={submitting} className="btn btn-primary w-full">
        {submitting ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
