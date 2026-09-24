"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SignOutButton from "@/components/SignOutButton";

type NavLink = { href: string; label: string };

export default function MobileMenu({
  links,
  user,
}: {
  links: NavLink[];
  user: { teamName: string; photoUrl: string } | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
        aria-expanded={open}
        className="flex flex-col justify-center gap-1.5 w-9 h-9 -mr-1"
      >
        <span
          className="block h-0.5 w-6 rounded transition-transform"
          style={{
            background: "var(--foreground)",
            transform: open ? "translateY(7px) rotate(45deg)" : "none",
          }}
        />
        <span
          className="block h-0.5 w-6 rounded transition-opacity"
          style={{ background: "var(--foreground)", opacity: open ? 0 : 1 }}
        />
        <span
          className="block h-0.5 w-6 rounded transition-transform"
          style={{
            background: "var(--foreground)",
            transform: open ? "translateY(-7px) rotate(-45deg)" : "none",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full border-b px-4 py-4 flex flex-col gap-3 text-sm font-medium shadow-lg"
          style={{ borderColor: "var(--border)", background: "var(--surface-solid)" }}
        >
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="py-1" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <Image
                src={user.photoUrl || "/default-avatar.svg"}
                alt={user.teamName}
                width={28}
                height={28}
                className="avatar w-7 h-7"
                unoptimized
              />
              <span className="font-semibold flex-1">{user.teamName}</span>
              <SignOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <Link href="/login" onClick={() => setOpen(false)}>
                Login
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
