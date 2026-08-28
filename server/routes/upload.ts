import { Hono } from 'hono';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import mime from 'mime';
import type { AppEnv } from '../env';
import { assertAuthor } from '../authorization';
import { MAX_FILE_SIZE } from '../../util/constants';
import { S3_AWS_ACCESS_KEY, S3_AWS_REGION, S3_AWS_S3_BUCKET_NAME, S3_AWS_SECRET_KEY } from '../config';

export const uploadRoutes = new Hono<AppEnv>().get('/upload-file', async (c) => {
  const ctx = c.get('ctx');
  assertAuthor(ctx);

  const file = c.req.query('file') || '';
  const s3Client = new S3Client({
    region: S3_AWS_REGION,
    credentials: { accessKeyId: S3_AWS_ACCESS_KEY, secretAccessKey: S3_AWS_SECRET_KEY },
  });

  const contentType = mime.getType(file) || 'application/octet-stream';
  try {
    const post = await createPresignedPost(s3Client, {
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
});
