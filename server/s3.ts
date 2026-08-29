import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3_AWS_ACCESS_KEY, S3_AWS_REGION, S3_AWS_S3_BUCKET_NAME, S3_AWS_SECRET_KEY } from './config';

let client: S3Client | null = null;

export function s3Client() {
  if (!client) {
    client = new S3Client({
      region: S3_AWS_REGION,
      credentials: { accessKeyId: S3_AWS_ACCESS_KEY, secretAccessKey: S3_AWS_SECRET_KEY },
    });
  }
  return client;
}

// The bucket is named for the domain it's served on, so in production a key is
// a url as-is. Locally there's no such dns, and it goes through the generic
// endpoint instead — same rule the browser side of the upload follows.
export function publicUrl(key: string) {
  return `https://${import.meta.env?.DEV ? 's3.amazonaws.com/' : ''}${S3_AWS_S3_BUCKET_NAME}/${key}`;
}

export async function getObject(key: string) {
  const response = await s3Client().send(new GetObjectCommand({ Bucket: S3_AWS_S3_BUCKET_NAME, Key: key }));
  const bytes = await response.Body!.transformToByteArray();
  return { bytes, contentType: response.ContentType || '' };
}

export async function putObject(key: string, bytes: Uint8Array, contentType: string) {
  await s3Client().send(
    new PutObjectCommand({
      Bucket: S3_AWS_S3_BUCKET_NAME,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      ContentDisposition: 'inline',
      // Derivative keys are content-addressed by the timestamp in their name,
      // so a key's bytes never change and this can be cached forever — the
      // same lifetime the presigned upload puts on originals.
      CacheControl: 'public, max-age=31536000',
    })
  );
  return publicUrl(key);
}
