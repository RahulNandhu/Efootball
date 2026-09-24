import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TournamentForm from "@/components/TournamentForm";

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { entries: true },
  });
  if (!tournament) notFound();

  const hasResults = (await prisma.match.count({ where: { tournamentId: id, homeScore: { not: null } } })) > 0;

  return (
    <div>
      <h1 className="page-title mb-6">Edit tournament</h1>
      <TournamentForm
        mode="edit"
        tournamentId={id}
        locked={hasResults}
        initial={{
          name: tournament.name,
          legType: tournament.legType,
          groupCount: tournament.groupCount,
          startDate: tournament.startDate.toISOString().slice(0, 10),
          knockoutFormat: tournament.knockoutFormat,
          hasThirdPlace: tournament.hasThirdPlace,
          userIds: tournament.entries.map((e) => e.userId),
        }}
      />
    </div>
  );
}
