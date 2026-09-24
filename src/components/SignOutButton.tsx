"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
    >
      Sign out
    </button>
  );
}
