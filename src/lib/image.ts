import sharp from "sharp";

const MAX_BYTES = 100 * 1024;

/**
 * Resizes/re-encodes an uploaded photo as JPEG, stepping down quality (and
 * finally dimensions) until it's under 100KB. Guarantees the size cap
 * server-side regardless of what the client sent.
 */
export async function compressPhotoUnder100KB(input: Buffer): Promise<Buffer> {
  let width = 512;

  for (let attempt = 0; attempt < 8; attempt++) {
    for (const quality of [80, 65, 50, 35, 20]) {
      const buf = await sharp(input)
        .rotate()
        .resize({ width, height: width, fit: "cover" })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();

      if (buf.byteLength <= MAX_BYTES) return buf;
    }
    width = Math.round(width * 0.75);
  }

  // Last resort: smallest reasonable size at lowest quality.
  return sharp(input)
    .rotate()
    .resize({ width: 64, height: 64, fit: "cover" })
    .jpeg({ quality: 20, mozjpeg: true })
    .toBuffer();
}
