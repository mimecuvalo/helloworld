import { inflateSync } from 'node:zlib';
import { encodeLqip, type Rgb } from '../../lib/lqip';
import { IMAGE_QUALITY, MAX_FILE_SIZE, MEDIUM_SIZE, ORIGINAL_DIR, THUMB_SIZE, THUMBS_DIR } from '../../util/constants';

// Resizing runs on Bun.Image, which needs the Bun runtime — vercel.json's
// `bunVersion` is what puts the deployed functions on it. Declared here rather
// than imported so the module still typechecks under @types/node alone.
declare const Bun: {
  Image: new (
    input: Uint8Array,
    options?: { maxPixels?: number; autoOrient?: boolean }
  ) => {
    metadata(): Promise<{ width: number; height: number; format: string }>;
    resize(width: number, height?: number, options?: { fit?: 'inside' | 'fill' | 'cover' }): BunImage;
  };
};
type BunImage = {
  jpeg(options?: { quality?: number }): BunImage;
  png(options?: { compressionLevel?: number }): BunImage;
  webp(options?: { quality?: number }): BunImage;
  bytes(): Promise<Uint8Array>;
};

export type ImageVariant = { bytes: Uint8Array; contentType: string; width: number; height: number };
export type ImageVariants = {
  medium: ImageVariant;
  thumb: ImageVariant;
  // Null when the placeholder couldn't be worked out — a format we can't decode
  // down to pixels. The image just loads without one.
  lqip: number | null;
};

export function hasImageSupport() {
  return typeof Bun !== 'undefined' && typeof Bun.Image === 'function';
}

// An upload lands under `original/`; the other two are that same path with the
// directory swapped, so a file's three sizes always sit at predictable keys.
export function derivedKeys(originalKey: string) {
  const marker = `/${ORIGINAL_DIR}/`;
  const at = originalKey.lastIndexOf(marker);
  if (at === -1) return null;
  const dir = originalKey.slice(0, at);
  const filename = originalKey.slice(at + marker.length);
  if (!filename || filename.includes('/')) return null;
  return { mediumKey: `${dir}/${filename}`, thumbKey: `${dir}/${THUMBS_DIR}/${filename}` };
}

// An animation survives only if it's left alone: Bun.Image writes single-frame
// output, so re-encoding one would freeze it on its first frame.
export function isAnimated(bytes: Uint8Array, contentType: string) {
  if (contentType === 'image/gif') {
    // More than one Graphic Control Extension (21 F9 04) means more than one frame.
    let frames = 0;
    for (let i = 0; i + 2 < bytes.length && frames < 2; i++) {
      if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 0x04) frames++;
    }
    return frames > 1;
  }
  if (contentType === 'image/png' || contentType === 'image/apng') {
    // An APNG announces itself with an acTL chunk, which by spec precedes the
    // first IDAT — so this never walks far.
    const head = bytes.subarray(0, 4096);
    for (let i = 0; i + 4 <= head.length; i++) {
      if (head[i] === 0x61 && head[i + 1] === 0x63 && head[i + 2] === 0x54 && head[i + 3] === 0x4c) return true;
    }
  }
  return false;
}

// What a derivative is written as. Photographs stay jpeg and screenshots stay
// png, because the key a derivative is written to keeps the original's
// extension — and a png served as `.jpg` would be a lie a CDN caches forever.
function encode(image: BunImage, contentType: string) {
  if (contentType === 'image/png') return image.png();
  if (contentType === 'image/webp') return image.webp({ quality: IMAGE_QUALITY });
  return image.jpeg({ quality: IMAGE_QUALITY });
}

function outputContentType(contentType: string) {
  if (contentType === 'image/png') return 'image/png';
  if (contentType === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function open(bytes: Uint8Array) {
  // autoOrient bakes in the EXIF rotation phones write, so a portrait photo
  // isn't served on its side to everything that ignores the tag. maxPixels is
  // decompression-bomb protection: a few KB of jpeg can claim to be gigapixels.
  return new Bun.Image(bytes, { maxPixels: 12000 * 12000, autoOrient: true });
}

async function variant(
  bytes: Uint8Array,
  contentType: string,
  size: number,
  source: { width: number; height: number }
): Promise<ImageVariant> {
  // Never enlarge: `fit: inside` scales up as readily as down, and a 400px
  // photo blown out to 2560 is a bigger, blurrier copy of itself. Anything
  // already inside the box is passed through untouched, which also spares it a
  // second lossy encode.
  if (source.width <= size && source.height <= size) {
    return { bytes, contentType, width: source.width, height: source.height };
  }
  const resized = await encode(open(bytes).resize(size, size, { fit: 'inside' }), contentType).bytes();
  const { width, height } = await open(resized).metadata();
  return { bytes: resized, contentType: outputContentType(contentType), width, height };
}

/**
 * The two derivatives an upload gets, plus the placeholder that stands in for
 * the thumbnail while it loads. Never touches the original bytes it's given.
 */
export async function deriveImageVariants(bytes: Uint8Array, contentType: string): Promise<ImageVariants> {
  if (!hasImageSupport()) throw new Error('Bun.Image is unavailable — is this running under the Bun runtime?');

  const lqip = await computeLqip(bytes).catch(() => null);

  // An animation is passed straight through at all three sizes, exactly as the
  // old thumbnailer did: better a heavy thumbnail than a still one.
  if (isAnimated(bytes, contentType)) {
    const { width, height } = await open(bytes).metadata();
    const passthrough = { bytes, contentType, width, height };
    return { medium: passthrough, thumb: passthrough, lqip };
  }

  const source = await open(bytes).metadata();
  const [medium, thumb] = await Promise.all([
    variant(bytes, contentType, MEDIUM_SIZE, source),
    variant(bytes, contentType, THUMB_SIZE, source),
  ]);
  return { medium, thumb, lqip };
}

/** The placeholder integer for an image, or null if it can't be decoded. */
export async function computeLqip(bytes: Uint8Array): Promise<number | null> {
  if (!hasImageSupport()) return null;
  // Bun.Image has no raw-pixel output, so both previews come back as tiny pngs
  // and are decoded here. At 3x2 and 32x32 that's a couple of kilobytes.
  const [preview, sample] = await Promise.all([
    open(bytes).resize(3, 2, { fit: 'fill' }).png().bytes(),
    open(bytes).resize(LQIP_SAMPLE, LQIP_SAMPLE, { fit: 'fill' }).png().bytes(),
  ]);
  const cells = decodePngPixels(preview);
  const base = dominantColor(decodePngPixels(sample));
  if (cells.length !== 6 || !base) return null;
  return encodeLqip({ cells, base });
}

// How wide the sample the base colour is picked out of is. Small enough to
// decode in no time, big enough that a colour has to actually cover some of the
// image to win.
const LQIP_SAMPLE = 32;

/**
 * The colour an image is mostly made of. Averaging the whole thing instead
 * would work, and be a line long, but averaging a sunset and a sea gives grey —
 * the one colour the picture hasn't got in it. So this buckets the pixels
 * coarsely and takes the middle of the fullest bucket.
 */
export function dominantColor(pixels: Rgb[]): Rgb | null {
  if (!pixels.length) return null;

  const buckets = new Map<number, { r: number; g: number; b: number; count: number }>();
  for (const { r, g, b } of pixels) {
    // Flat white and flat black are backdrops — a photo matted on white is not
    // a white photo — so they only win when there's nothing else at all.
    const isBackdrop = (r > 250 && g > 250 && b > 250) || (r < 8 && g < 8 && b < 8);
    const key = (isBackdrop ? 1 : 0) * 4096 + (r >> 5) * 64 + (g >> 5) * 8 + (b >> 5);
    const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.count++;
    buckets.set(key, bucket);
  }

  let best: { r: number; g: number; b: number; count: number } | null = null;
  let bestKey = 0;
  for (const [key, bucket] of buckets) {
    const isBackdrop = key >= 4096;
    const bestIsBackdrop = bestKey >= 4096;
    if (!best || (bestIsBackdrop && !isBackdrop) || (bestIsBackdrop === isBackdrop && bucket.count > best.count)) {
      best = bucket;
      bestKey = key;
    }
  }
  if (!best) return null;

  return {
    r: Math.round(best.r / best.count),
    g: Math.round(best.g / best.count),
    b: Math.round(best.b / best.count),
  };
}

/**
 * The pixels of a small, non-interlaced, 8-bit png — which is all Bun.Image
 * writes, and all this is asked to read. Pulling in a decoder for a six-pixel
 * image would be the more surprising choice.
 */
export function decodePngPixels(png: Uint8Array): Rgb[] {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  let offset = 8; // past the signature
  let width = 0;
  let height = 0;
  let colorType = 0;
  const data: Uint8Array[] = [];

  while (offset + 8 <= png.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(png[offset + 4], png[offset + 5], png[offset + 6], png[offset + 7]);
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      colorType = png[offset + 17];
      const bitDepth = png[offset + 16];
      const interlace = png[offset + 20];
      if (bitDepth !== 8 || interlace !== 0) return [];
    } else if (type === 'IDAT') {
      data.push(png.subarray(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  // grey, rgb, grey+alpha, rgba — the four 8-bit colour types.
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType as 0 | 2 | 4 | 6];
  if (!channels || !width || !height) return [];

  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(data));
  if (raw.length < height * (stride + 1)) return [];

  // Undo the per-scanline filter each row carries as its first byte.
  const pixels = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const row = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upLeft = x >= channels && y > 0 ? pixels[(y - 1) * stride + x - channels] : 0;
      let value = raw[row + x];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const dl = Math.abs(p - left);
        const du = Math.abs(p - up);
        const dul = Math.abs(p - upLeft);
        value += dl <= du && dl <= dul ? left : du <= dul ? up : upLeft;
      }
      pixels[y * stride + x] = value & 0xff;
    }
  }

  const isGrey = channels <= 2;
  return Array.from({ length: width * height }, (_, index) => {
    const at = index * channels;
    return isGrey
      ? { r: pixels[at], g: pixels[at], b: pixels[at] }
      : { r: pixels[at], g: pixels[at + 1], b: pixels[at + 2] };
  });
}

// Uploads are capped client-side by the presigned post's content-length-range,
// but a derivative job reads whatever is at the key it's handed, so the cap is
// re-checked before anything is decoded.
export function assertWithinSizeLimit(byteLength: number) {
  if (byteLength > MAX_FILE_SIZE) throw new Error(`image is ${byteLength} bytes, over the ${MAX_FILE_SIZE} limit`);
}
