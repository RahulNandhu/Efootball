import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function NavBar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur-xl"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div
        className="h-[3px] w-full"
        style={{ background: "linear-gradient(90deg, var(--brand), var(--brand-2), var(--win))" }}
      />
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-lg">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shadow-md"
            style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}
          >
            ⚽
          </span>
          <span
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

        <nav className="flex items-center gap-5 text-sm font-medium">
          {user && (
            <>
              <Link href="/" className="hover:text-[var(--brand)]">
                Home
              </Link>
              <Link href="/compare" className="hover:text-[var(--brand)]">
                Compare
              </Link>
              {user.role === "ADMIN" && (
                <>
                  <Link href="/admin/approvals" className="hover:text-[var(--brand)]">
                    Approvals
                  </Link>
                  <Link href="/admin/users" className="hover:text-[var(--brand)]">
                    Users
                  </Link>
                </>
              )}
            </>
          )}

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
      </div>
    </header>
  );
}
