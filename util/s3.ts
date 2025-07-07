export default async function uploadFileToS3(file: File | Blob, fileName: string, section: string, album: string) {
  const extension = fileName.substring(fileName.lastIndexOf('.') + 1);
  const filenameScrubbed = fileName.replace(`.${extension}`, '').replace(/\W/g, '-');
  const filename = encodeURIComponent(`${section}/${album}/${new Date().getTime()}-${filenameScrubbed}.${extension}`);
  const data = await getS3Info(filename);

  const url = await uploadFileUsingS3Info(data, file, filename);
  return url;
}

export async function getS3Info(filename: string) {
  const response = await fetch(`/api/upload-file?file=${filename}`);
  const data = await response.json();

  return data;
}

export async function uploadFileUsingS3Info(data: any, file: Blob, filename: string) {
  const { bucket, key } = data.fields;

  const formData = new FormData();
  Object.entries({ ...data.fields }).forEach(([key, value]: [key: string, value: string | unknown]) => {
    formData.append(key, value as string);
  });
  formData.append('file', file, filename);

  await fetch(data.url, {
    method: 'POST',
    body: formData,
  });

  // TODO(mime): There's probably a better way than constructing it like this manually.
  return `https://${process.env.NODE_ENV === 'development' ? 's3.amazonaws.com/' : ''}${bucket}/${key}`;
}
