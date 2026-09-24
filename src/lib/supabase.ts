import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const AVATAR_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "avatars";

let cached: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  if (!cached) {
    cached = createClient(url, key, { auth: { persistSession: false } });
  }
  return cached;
}

export async function uploadAvatar(userId: string, file: Buffer) {
  const supabaseAdmin = getSupabaseAdmin();
  const fileName = `${userId}-${Date.now()}.jpg`;

  if (!supabaseAdmin) {
    // Local-dev fallback (no Supabase configured yet): write into /public/uploads.
    // Not used in production — Vercel's filesystem isn't persistent, so
    // SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY must be set there.
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fileName), file);
    return `/uploads/${fileName}`;
  }

  const { error } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .upload(fileName, file, { contentType: "image/jpeg", upsert: true });

  if (error) throw new Error(`Avatar upload failed: ${error.message}`);

  const { data } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}
