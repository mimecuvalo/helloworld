import { ORIGINAL_DIR } from 'util/constants';

// The three sizes an uploaded image becomes, plus the placeholder that stands
// in for it while it loads. See server/services/images.ts for how they're made.
export type UploadedImage = {
  original: string;
  medium: string;
  thumb: string;
  lqip: number | null;
  width: number;
  height: number;
};

function keyFor(fileName: string, section: string, album: string, ...dirs: string[]) {
  const extension = fileName.substring(fileName.lastIndexOf('.') + 1);
  const filenameScrubbed = fileName.replace(`.${extension}`, '').replace(/\W/g, '-');
  // Empty segments are dropped: an album-less section used to leave a `//` in
  // the key, and a directory named '' in the bucket listing along with it.
  const path = [section, album, ...dirs].filter(Boolean).join('/');
  return encodeURIComponent(`${path}/${new Date().getTime()}-${filenameScrubbed}.${extension}`);
}

export default async function uploadFileToS3(file: File | Blob, fileName: string, section: string, album: string) {
  const filename = keyFor(fileName, section, album);
  const data = await getS3Info(filename);
  return uploadFileUsingS3Info(data, file, filename);
}

/**
 * Uploads an image and returns the three sizes it becomes. The original goes
 * straight to S3 from here — it's far too big to hand a serverless function as
 * a request body — and the server is then asked to derive the rest from it.
 */
export async function uploadImageToS3(
  file: File | Blob,
  fileName: string,
  section: string,
  album: string
): Promise<UploadedImage> {
  const filename = keyFor(fileName, section, album, ORIGINAL_DIR);
  const data = await getS3Info(filename);
  await uploadFileUsingS3Info(data, file, filename);

  // The server reads the key it was just handed and writes the rest alongside
  // it, so the three urls all come back from here rather than being guessed.
  const response = await fetch('/api/derive-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: data.fields.key }),
  });
  if (!response.ok) throw new Error('failed deriving image sizes');
  return response.json();
}

export async function getS3Info(filename: string) {
  const response = await fetch(`/api/upload-file?file=${filename}`);
  return response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function uploadFileUsingS3Info(data: any, file: Blob, filename: string) {
  const { bucket, key } = data.fields;

  const formData = new FormData();
  Object.entries({ ...data.fields }).forEach(([k, value]) => {
    formData.append(k, value as string);
  });
  formData.append('file', file, filename);

  await fetch(data.url, { method: 'POST', body: formData });

  return `https://${import.meta.env.DEV ? 's3.amazonaws.com/' : ''}${bucket}/${key}`;
}
