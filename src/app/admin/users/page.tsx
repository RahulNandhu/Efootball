import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import RoleToggle from "@/components/RoleToggle";
import DeleteUserButton from "@/components/DeleteUserButton";
import ResetPasswordButton from "@/components/ResetPasswordButton";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const canManage = session.user.isDefaultAdmin;

  return (
    <div>
      <h1 className="page-title mb-6">Users</h1>

      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="card flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <Image
                src={u.photoUrl || "/default-avatar.svg"}
                alt={u.teamName}
                width={36}
                height={36}
                unoptimized
                className="avatar w-9 h-9"
              />
              <div>
                <div className="font-medium">
                  {u.teamName} <span className="text-[var(--muted)]">@{u.username}</span>
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {u.role}
                  {u.isDefaultAdmin && " · default admin"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {u.isDefaultAdmin ? (
                <span className="badge badge-draw">Protected</span>
              ) : (
                <>
                  <RoleToggle userId={u.id} role={u.role} />
                  {canManage && <DeleteUserButton userId={u.id} teamName={u.teamName} />}
                </>
              )}
              {canManage && <ResetPasswordButton userId={u.id} teamName={u.teamName} />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
