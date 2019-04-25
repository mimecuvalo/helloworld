import constants from '../../../shared/constants';
import { buildUrl, contentUrl, parseContentUrl, profileUrl } from '../../../shared/util/url_factory';
import models from '../../data/models';

export default async (req, res, next) => {
  const { username, name } = parseContentUrl(req.query.url);
  const contentOwner = await models.User.findOne({ attributes: ['favicon', 'logo', 'title'], where: { username } });
  const content = await models.Content.findOne({
    attributes: ['username', 'section', 'album', 'name', 'thumb', 'title'],
    where: { username, name },
  });

  if (!contentOwner || !content) {
    return res.sendStatus(404);
  }

  let thumb;
  if (content?.thumb) {
    thumb = content.thumb;
    if (!/^https?:/.test(thumb)) {
      thumb = buildUrl({ req, pathname: thumb });
    }
  }

  if (!thumb) {
    thumb = buildUrl({ req, pathname: contentOwner.logo || contentOwner.favicon });
  }

  const contentUrlWithoutHost = contentUrl(content);
  const contentUrlWithHost = contentUrl(content, req);
  const homepageUrl = buildUrl({ req, pathname: '/' });
  const profile = profileUrl(username, req);
  let htmlContent = thumb ? `<img src="${thumb}" alt="thumbnail" title="${content.title}" />` : content.title;
  htmlContent = htmlContent.replace(/</g, '\u003c').replace(/>/g, '\u003e');

  const statsUrl = buildUrl({ req, pathname: '/api/stats', searchParams: { url: contentUrlWithoutHost } });
  const statsImg = `<img src="${statsUrl}" alt="stats" />`;

  res.type('application/json+oembed');
  res.json({
    type: 'rich',
    version: '1.0',
    provider_url: homepageUrl,
    title: content.title,
    author_name: content.username,
    author_url: profile,
    provider_name: contentOwner.title ? contentOwner.title : undefined,
    width: thumb ? constants.thumbWidth : undefined,
    height: thumb ? constants.thumbHeight : undefined,
    thumbnail_width: thumb ? constants.thumbWidth : undefined,
    thumbnail_height: thumb ? constants.thumbHeight : undefined,
    thumbnail_url: thumb || undefined,
    html: `<a href="${contentUrlWithHost}">${htmlContent}</a>${statsImg}`,
  });
};
