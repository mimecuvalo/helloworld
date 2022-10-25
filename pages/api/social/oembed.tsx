import type { NextApiRequest, NextApiResponse } from 'next';
import { buildUrl, contentUrl, profileUrl } from 'util/url-factory';
import { getLocalContent, getLocalUser } from 'social-butterfly/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const contentOwner = await getLocalUser(req.query.resource as string);
  const content = await getLocalContent(req.query.resource as string);

  if (!contentOwner || !content) {
    return res.status(404).end();
  }

  const thumb = buildUrl({ req, pathname: content?.thumb || contentOwner.logo || contentOwner.favicon || '' });

  // If thumb is present, present that as the embed, otherwise it's just the title sadly for now.
  let htmlContent = thumb ? `<img src="${thumb}" alt="thumbnail" title="${content.title}" />` : content.title;
  // Escape the less than/greater than signs.
  htmlContent = htmlContent.replace(/</g, '\u003c').replace(/>/g, '\u003e');

  // If your server has a hookup to listen to /api/stats you can get info on amount of times your content has been read.
  const statsUrl = buildUrl({ req, pathname: '/api/stats', searchParams: { resource: contentUrl(content, req) } });
  const statsImg = `<img src="${statsUrl}" alt="stats" />`;

  res.setHeader('Content-Type', 'application/json+oembed');
  const thumbWidth = 154;
  const thumbHeight = 115;
  res.json({
    type: 'rich',
    version: '1.0',
    provider_url: buildUrl({ req, pathname: '/' }),
    title: content.title,
    author_name: content.username,
    author_url: profileUrl(contentOwner.username, req),
    provider_name: contentOwner.title ? contentOwner.title : undefined,
    width: thumb ? thumbWidth : undefined,
    height: thumb ? thumbHeight : undefined,
    thumbnail_width: thumb ? thumbWidth : undefined,
    thumbnail_height: thumb ? thumbHeight : undefined,
    thumbnail_url: thumb || undefined,
    html: `<a href="${contentUrl(content, req)}">${htmlContent}</a>${statsImg}`,
  });
}
