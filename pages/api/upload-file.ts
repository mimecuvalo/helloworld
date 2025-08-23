import type { NextApiRequest, NextApiResponse } from 'next';

import { MAX_FILE_SIZE } from 'util/constants';
import { User } from 'prisma/client';
import authenticate from 'application/authentication';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { S3Client } from '@aws-sdk/client-s3';
import mime from 'mime/lite';

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse, currentUser: User) {
  const AWS_CONFIG = {
    region: process.env.S3_AWS_REGION || '',
    credentials: {
      accessKeyId: process.env.S3_AWS_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_AWS_SECRET_KEY || '',
    },
  };

  try {
    const s3Client = new S3Client(AWS_CONFIG);

    const contentType = mime.getType(req.query.file as string) || 'application/octet-stream';
    const extraFields = {
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=31536000',
      'Content-Type': contentType,
    };

    const post = await createPresignedPost(s3Client, {
      Bucket: process.env.S3_AWS_S3_BUCKET_NAME!,
      Key: `${currentUser.username}/${req.query.file}`,
      Fields: {
        ...extraFields,
      },
      Expires: 60, // seconds
      Conditions: [['content-length-range', 0, MAX_FILE_SIZE]],
    });

    return res.status(200).json(post);
  } catch (error) {
    console.error(error);
    return res.status(400).end('failed uploading file');
  }
});
