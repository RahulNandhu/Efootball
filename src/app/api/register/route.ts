import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { compressPhotoUnder100KB } from "@/lib/image";
import { uploadAvatar } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    teamName: formData.get("teamName"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "A profile photo is required" }, { status: 400 });
  }
  if (!photo.type.startsWith("image/")) {
    return NextResponse.json({ error: "Photo must be an image file" }, { status: 400 });
  }

  const { username, password, teamName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
  }

  let compressed: Buffer;
  try {
    const raw = Buffer.from(await photo.arrayBuffer());
    compressed = await compressPhotoUnder100KB(raw);
  } catch {
    return NextResponse.json({ error: "Could not process the photo. Try a different image." }, { status: 400 });
  }

  let photoUrl: string;
  try {
    photoUrl = await uploadAvatar(username, compressed);
  } catch {
    return NextResponse.json({ error: "Photo upload failed. Please try again." }, { status: 502 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { username, passwordHash, teamName, photoUrl },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
