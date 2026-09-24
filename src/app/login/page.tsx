import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto card p-6">
      <h1 className="page-title mb-6">Sign in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-4 text-sm text-[var(--muted)]">
        No account yet?{" "}
        <Link href="/register" className="text-[var(--brand)] font-medium hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
