import { NextRequest, NextResponse } from 'next/server';
import { MAX_FILE_SIZE } from 'util/constants';
import { User } from '@prisma/client';
import authenticate from '@/application/authentication';
import aws from 'aws-sdk';
import mime from 'mime/lite';

export default authenticate(async (request: NextRequest, currentUser: User) => {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json({ error: 'File parameter required' }, { status: 400 });
    }

    const AWS_CONFIG = {
      accessKeyId: process.env.S3_AWS_ACCESS_KEY,
      secretAccessKey: process.env.S3_AWS_SECRET_KEY,
      region: process.env.S3_AWS_REGION,
    };

    const s3 = new aws.S3(AWS_CONFIG);

    aws.config.update({
      ...AWS_CONFIG,
      signatureVersion: 'v4',
    });

    const extraFields = {
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=31536000',
      'Content-Type': mime.getType(fileName),
    };

    const post = await s3.createPresignedPost({
      Bucket: process.env.S3_AWS_S3_BUCKET_NAME,
      Fields: {
        key: `${currentUser.username}/${fileName}`,
        ...extraFields,
      },
      Expires: 60, // seconds
      Conditions: [['content-length-range', 0, MAX_FILE_SIZE]],
    });

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error('Upload file error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});
