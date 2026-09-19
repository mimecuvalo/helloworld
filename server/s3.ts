import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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

export type S3File = { key: string; size: number; lastModified: string | null };

export type S3Listing = {
  files: S3File[];
  folders: string[];
  nextToken: string | undefined;
};

/**
 * One page of the bucket under a prefix. With a delimiter, everything below the
 * next `/` collapses into `folders` instead of coming back key by key — which
 * is what makes a folder view one call rather than a walk of the whole bucket.
 */
export async function listObjects({
  prefix,
  delimiter,
  continuationToken,
}: {
  prefix: string;
  delimiter?: string;
  continuationToken?: string;
}): Promise<S3Listing> {
  const response = await s3Client().send(
    new ListObjectsV2Command({
      Bucket: S3_AWS_S3_BUCKET_NAME,
      Prefix: prefix,
      Delimiter: delimiter,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    })
  );

  return {
    files: (response.Contents || [])
      // A prefix can exist as a zero-byte object of its own — the "folder" a
      // console creates. That is the directory, not a file inside it.
      .filter((item) => item.Key && item.Key !== prefix)
      .map((item) => ({
        key: item.Key!,
        size: item.Size ?? 0,
        lastModified: item.LastModified?.toISOString() ?? null,
      })),
    folders: (response.CommonPrefixes || []).map((item) => item.Prefix).filter((prefix): prefix is string => !!prefix),
    nextToken: response.NextContinuationToken,
  };
}

export async function deleteObjects(keys: string[]) {
  const deleted: string[] = [];
  const errors: { key: string; message: string }[] = [];

  // The API takes a thousand keys at a time. A selection is nowhere near that,
  // but the loop costs a line and the alternative is a silent partial delete.
  for (let at = 0; at < keys.length; at += 1000) {
    const response = await s3Client().send(
      new DeleteObjectsCommand({
        Bucket: S3_AWS_S3_BUCKET_NAME,
        Delete: { Objects: keys.slice(at, at + 1000).map((Key) => ({ Key })), Quiet: false },
      })
    );
    for (const item of response.Deleted || []) if (item.Key) deleted.push(item.Key);
    for (const item of response.Errors || []) {
      errors.push({ key: item.Key || '', message: item.Message || 'could not be deleted' });
    }
  }

  return { deleted, errors };
}
