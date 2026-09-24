import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import SignOutButton from "@/components/SignOutButton";
import MobileMenu from "@/components/MobileMenu";

export default async function NavBar() {
  const session = await auth();
  const user = session?.user;

  const links = user
    ? [
        { href: "/", label: "Home" },
        { href: "/compare", label: "Compare" },
        ...(user.role === "ADMIN"
          ? [
              { href: "/admin/approvals", label: "Approvals" },
              { href: "/admin/users", label: "Users" },
            ]
          : []),
      ]
    : [];

  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur-xl relative"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div
        className="h-[3px] w-full"
        style={{ background: "linear-gradient(90deg, var(--brand), var(--brand-2), var(--win))" }}
      />
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-lg shrink-0">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shadow-md shrink-0"
            style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}
          >
            ⚽
          </span>
          <span
            className="whitespace-nowrap"
            style={{
              background: "linear-gradient(90deg, var(--brand), var(--brand-2))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            eFootball League
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[var(--brand)]">
              {l.label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-2 pl-3 ml-1 border-l" style={{ borderColor: "var(--border)" }}>
              <Image
                src={user.photoUrl || "/default-avatar.svg"}
                alt={user.teamName}
                width={30}
                height={30}
                className="avatar w-[30px] h-[30px]"
                unoptimized
              />
              <span className="font-semibold">{user.teamName}</span>
              <SignOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="hover:text-[var(--brand)]">
                Login
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </nav>

        <MobileMenu
          links={links}
          user={user ? { teamName: user.teamName, photoUrl: user.photoUrl } : null}
        />
      </div>
    </header>
  );
}
