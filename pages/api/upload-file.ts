import type { NextApiRequest, NextApiResponse } from 'next';

import { MAX_FILE_SIZE } from 'app/constants';
import authenticate from 'app/authentication';
import aws from 'aws-sdk';
import mime from 'mime/lite';

// eslint-disable-next-line
export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse, currentUser: any) {
  const AWS_CONFIG = {
    accessKeyId: process.env.S3_AWS_ACCESS_KEY,
    secretAccessKey: process.env.S3_AWS_SECRET_KEY,
    region: process.env.S3_AWS_REGION,
  };

  try {
    const s3 = new aws.S3(AWS_CONFIG);

    aws.config.update({
      ...AWS_CONFIG,
      signatureVersion: 'v4',
    });

    const extraFields = {
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=31536000',
      'Content-Type': mime.getType(req.query.file as string),
    };

    const post = await s3.createPresignedPost({
      Bucket: process.env.S3_AWS_S3_BUCKET_NAME,
      Fields: {
        key: `${currentUser.ID}/${req.query.file}`,
        ...extraFields,
      },
      Expires: 60, // seconds
      Conditions: [['content-length-range', 0, MAX_FILE_SIZE]],
    });

    return res.status(200).json(post);
  } catch (error) {
    console.log(error);
    return res.end(400);
  }
});
