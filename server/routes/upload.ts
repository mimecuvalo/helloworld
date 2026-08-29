import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import mime from 'mime';
import type { AppEnv } from '../env';
import { assertAuthor } from '../authorization';
import { MAX_FILE_SIZE } from '../../util/constants';
import { S3_AWS_S3_BUCKET_NAME } from '../config';
import { getObject, publicUrl, putObject, s3Client } from '../s3';
import { assertWithinSizeLimit, deriveImageVariants, derivedKeys, hasImageSupport } from '../services/images';

export const uploadRoutes = new Hono<AppEnv>()
  .get('/upload-file', async (c) => {
    const ctx = c.get('ctx');
    assertAuthor(ctx);

    const file = c.req.query('file') || '';
    const contentType = mime.getType(file) || 'application/octet-stream';
    try {
      const post = await createPresignedPost(s3Client(), {
        Bucket: S3_AWS_S3_BUCKET_NAME,
        Key: `${ctx.currentUser?.username}/${file}`,
        Fields: {
          'Content-Disposition': 'inline',
          'Cache-Control': 'public, max-age=31536000',
          'Content-Type': contentType,
        },
        Expires: 60,
        Conditions: [['content-length-range', 0, MAX_FILE_SIZE]],
      });
      return c.json(post);
    } catch (error) {
      console.error(error);
      return c.body('failed uploading file', 400);
    }
  })
  // The browser uploads the original straight to S3 — it's up to 10MB, well
  // past what a function is willing to take as a request body — and then asks
  // here for the two sizes derived from it. So this reads the key it was just
  // given rather than any bytes of its own.
  .post('/derive-image', zValidator('json', z.object({ key: z.string().max(1024) })), async (c) => {
    const ctx = c.get('ctx');
    assertAuthor(ctx);

    const { key } = c.req.valid('json');
    // Every key is prefixed with the account that owns it, so this is the whole
    // of the authorization check: an author derives from their own uploads.
    if (!key.startsWith(`${ctx.currentUser!.username}/`) || key.includes('..')) {
      return c.json({ error: 'not your file' }, 403);
    }
    const keys = derivedKeys(key);
    if (!keys) return c.json({ error: 'not an original' }, 400);

    try {
      const original = await getObject(key);
      assertWithinSizeLimit(original.bytes.byteLength);
      const contentType = original.contentType || mime.getType(key) || 'application/octet-stream';
      if (!contentType.startsWith('image/')) return c.json({ error: 'not an image' }, 400);

      // Resizing needs Bun.Image, which needs the Bun runtime (vercel.json's
      // `bunVersion`). If a deploy ever lands on plain Node, an upload should
      // still work the way it did before any of this existed — at full size,
      // with no placeholder — rather than failing in the author's face.
      if (!hasImageSupport()) {
        console.error('Bun.Image is unavailable: serving the original at every size. Is this the Bun runtime?');
        const url = publicUrl(key);
        return c.json({ original: url, medium: url, thumb: url, lqip: null, width: 0, height: 0 });
      }

      const { medium, thumb, lqip } = await deriveImageVariants(original.bytes, contentType);
      const [mediumUrl, thumbUrl] = await Promise.all([
        putObject(keys.mediumKey, medium.bytes, medium.contentType),
        putObject(keys.thumbKey, thumb.bytes, thumb.contentType),
      ]);

      return c.json({
        original: publicUrl(key),
        medium: mediumUrl,
        thumb: thumbUrl,
        lqip,
        width: medium.width,
        height: medium.height,
      });
    } catch (error) {
      console.error('failed deriving image sizes', error);
      return c.json({ error: 'failed deriving image sizes' }, 500);
    }
  });
