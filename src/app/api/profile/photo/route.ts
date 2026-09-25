import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compressPhotoUnder100KB } from "@/lib/image";
import { uploadAvatar } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const photo = formData.get("photo");

  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "A photo is required" }, { status: 400 });
  }
  if (!photo.type.startsWith("image/")) {
    return NextResponse.json({ error: "Photo must be an image file" }, { status: 400 });
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
    photoUrl = await uploadAvatar(session.user.id, compressed);
  } catch {
    return NextResponse.json({ error: "Photo upload failed. Please try again." }, { status: 502 });
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { photoUrl } });

  return NextResponse.json({ photoUrl });
}
