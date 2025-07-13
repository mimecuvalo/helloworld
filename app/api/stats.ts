import { NextRequest, NextResponse } from 'next/server';
import { isRobotViewing } from 'util/crawler';
import { parseContentUrl } from 'util/url-factory';
import prisma from 'data/prisma';

const buf = Buffer.from('R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

export default async function stats(request: NextRequest) {
  if (request.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');

    if (!resource) {
      return NextResponse.json({ statusCode: 400, message: 'resource parameter required' }, { status: 400 });
    }

    const { username, name } = parseContentUrl(resource);
    const content = await prisma?.content.findUnique({ where: { username_name: { username, name } } });

    if (!content) {
      return NextResponse.json({ statusCode: 404, message: 'not found' }, { status: 404 });
    }

    const attributes = isRobotViewing(request) ? { count_robot: content.countRobot + 1 } : { count: content.count + 1 };

    await prisma?.content.update({
      data: attributes,
      where: {
        username_name: {
          username,
          name: content.name,
        },
      },
    });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ statusCode: 500, message: 'internal server error' }, { status: 500 });
  }
}
