import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only the default admin can reset another user's password — there's no
  // self-service "forgot password" flow (no email on file), so this is the
  // recovery path.
  if (!session.user.isDefaultAdmin) {
    return NextResponse.json({ error: "Only the default admin can reset passwords" }, { status: 403 });
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
