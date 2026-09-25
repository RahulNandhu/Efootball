import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ProfilePhotoForm from "@/components/ProfilePhotoForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-sm mx-auto card p-6">
      <h1 className="page-title mb-1">{session.user.teamName}</h1>
      <p className="text-sm text-[var(--muted)] mb-6">Update your profile photo.</p>
      <ProfilePhotoForm currentPhotoUrl={session.user.photoUrl} />
    </div>
  );
}
