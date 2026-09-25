"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePhotoForm({ currentPhotoUrl }: { currentPhotoUrl: string }) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!photo) {
      setError("Choose a photo first");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.set("photo", photo);

    const res = await fetch("/api/profile/photo", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSubmitting(false);
      setError(data.error ?? "Could not update photo");
      return;
    }

    router.refresh();
    setSubmitting(false);
    setSuccess(true);
    setPhoto(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <label
        htmlFor="profile-photo-upload"
        className="group relative flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-colors hover:border-[var(--brand)]"
        style={{ borderColor: "transparent", background: "var(--surface-muted)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview ?? currentPhotoUrl ?? "/default-avatar.svg"} alt="Profile" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent group-hover:bg-black/50 group-hover:text-white text-xs font-semibold transition-colors">
          Change photo
        </div>
        <input
          id="profile-photo-upload"
          type="file"
          accept="image/*"
          onChange={onPhotoChange}
          className="sr-only"
        />
      </label>

      <p className="text-xs text-[var(--muted)]">Automatically compressed to under 100KB after upload.</p>

      {error && <p className="text-sm text-[var(--loss)]">{error}</p>}
      {success && <p className="text-sm text-[var(--win)]">Photo updated!</p>}

      <button type="submit" disabled={submitting || !photo} className="btn btn-primary">
        {submitting ? "Uploading..." : "Save photo"}
      </button>
    </form>
  );
}
