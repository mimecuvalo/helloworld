import { NextRequest, NextResponse } from 'next/server';
import { THUMB_HEIGHT, THUMB_WIDTH } from 'util/constants';
import { buildUrl, contentUrl, profileUrl } from 'util/url-factory';
import { getLocalContent, getLocalUser } from 'social-butterfly/db';

export default async function oembed(request: NextRequest) {
  if (request.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { searchParams } = request.nextUrl;
  const resource = searchParams.get('resource');

  if (!resource) {
    return new NextResponse('Missing resource parameter', { status: 400 });
  }

  const contentOwner = await getLocalUser(resource);
  const content = await getLocalContent(resource);

  if (!contentOwner || !content) {
    return new NextResponse('Content or user not found', { status: 404 });
  }

  const thumb = buildUrl({ req: request, pathname: content?.thumb || contentOwner.logo || contentOwner.favicon || '' });

  // If thumb is present, present that as the embed, otherwise it's just the title sadly for now.
  let htmlContent = thumb ? `<img src="${thumb}" alt="thumbnail" title="${content.title}" />` : content.title;
  // Escape the less than/greater than signs.
  htmlContent = htmlContent.replace(/</g, '\u003c').replace(/>/g, '\u003e');

  // If your server has a hookup to listen to /api/stats you can get info on amount of times your content has been read.
  const statsUrl = buildUrl({
    req: request,
    pathname: '/api/stats',
    searchParams: { resource: contentUrl(content, request) },
  });
  const statsImg = `<img src="${statsUrl}" alt="stats" />`;

  const thumbWidth = THUMB_WIDTH;
  const thumbHeight = THUMB_HEIGHT;

  const json = {
    type: 'rich',
    version: '1.0',
    provider_url: buildUrl({ req: request, pathname: '/' }),
    title: content.title,
    author_name: content.username,
    author_url: profileUrl(contentOwner.username, request),
    provider_name: contentOwner.title ? contentOwner.title : undefined,
    width: thumb ? thumbWidth : undefined,
    height: thumb ? thumbHeight : undefined,
    thumbnail_width: thumb ? thumbWidth : undefined,
    thumbnail_height: thumb ? thumbHeight : undefined,
    thumbnail_url: thumb || undefined,
    html: `<a href="${contentUrl(content, request)}">${htmlContent}</a>${statsImg}`,
  };

  return Response.json(json, {
    headers: {
      'Content-Type': 'application/json+oembed',
    },
  });
}
