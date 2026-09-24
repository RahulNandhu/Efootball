import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="max-w-sm mx-auto card p-6">
      <h1 className="page-title mb-6">Register</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--brand)] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
