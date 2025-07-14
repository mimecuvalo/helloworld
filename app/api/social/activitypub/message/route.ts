import { Activity, createArticle } from 'social-butterfly/activitystreams';
import { NextRequest, NextResponse } from 'next/server';
import { getLocalContent, getLocalUser } from 'social-butterfly/db';

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const resource = searchParams.get('resource');

  if (!resource) {
    return new NextResponse('Missing resource parameter', { status: 400 });
  }

  const content = await getLocalContent(resource);
  const user = await getLocalUser(resource);
  if (!content || !user) {
    return new NextResponse('Content or user not found', { status: 404 });
  }

  const json = (await createArticle(request, content, user)).object as Activity;
  // TODO(mime): mistake?
  //json['@context'] = 'https://www.w3.org/ns/activitystreams';
  return NextResponse.json(json);
};
