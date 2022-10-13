import { buildUrl } from 'util/url-factory';

export default (options) => async (req, res, next) => {
  const { constants, getLocalUser, getLocalContent } = options;

  const contentOwner = await getLocalUser(req.query.resource, req);
  const content = await getLocalContent(req.query.resource, req);

  if (!contentOwner || !content) {
    return res.sendStatus(404);
  }

  const thumb = buildUrl({ req, pathname: content?.thumb || contentOwner.logo || contentOwner.favicon });

  // If thumb is present, present that as the embed, otherwise it's just the title sadly for now.
  let htmlContent = thumb ? `<img src="${thumb}" alt="thumbnail" title="${content.title}" />` : content.title;
  // Escape the less than/greater than signs.
  htmlContent = htmlContent.replace(/</g, '\u003c').replace(/>/g, '\u003e');

  // If your server has a hookup to listen to /api/stats you can get info on amount of times your content has been read.
  const statsUrl = buildUrl({ req, pathname: '/api/stats', searchParams: { resource: content.url } });
  const statsImg = `<img src="${statsUrl}" alt="stats" />`;

  res.type('application/json+oembed');
  res.json({
    type: 'rich',
    version: '1.0',
    provider_url: buildUrl({ req, pathname: '/' }),
    title: content.title,
    author_name: content.username,
    author_url: contentOwner.url,
    provider_name: contentOwner.title ? contentOwner.title : undefined,
    width: thumb ? constants.thumbWidth : undefined,
    height: thumb ? constants.thumbHeight : undefined,
    thumbnail_width: thumb ? constants.thumbWidth : undefined,
    thumbnail_height: thumb ? constants.thumbHeight : undefined,
    thumbnail_url: thumb || undefined,
    html: `<a href="${content.url}">${htmlContent}</a>${statsImg}`,
  });
};
