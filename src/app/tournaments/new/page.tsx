import { redirect } from "next/navigation";
import { auth } from "@/auth";
import TournamentForm from "@/components/TournamentForm";

export default async function NewTournamentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div>
      <h1 className="page-title mb-6">New tournament</h1>
      <TournamentForm mode="create" />
    </div>
  );
}
