export default async function uploadFileToS3(file: File | Blob, fileName: string, section: string, album: string) {
  const extension = fileName.substring(fileName.lastIndexOf('.') + 1);
  const filenameScrubbed = fileName.replace(`.${extension}`, '').replace(/\W/g, '-');
  const filename = encodeURIComponent(`${section}/${album}/${new Date().getTime()}-${filenameScrubbed}.${extension}`);
  const data = await getS3Info(filename);
  return uploadFileUsingS3Info(data, file, filename);
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
