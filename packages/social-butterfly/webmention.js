import cheerio from 'cheerio';
import fetch from 'node-fetch';
import { fetchText, sanitizeHTML } from './util/crawler';
import { getUserRemoteInfo } from './discover_user';
import { mention as emailMention } from './email';

export async function reply(req, contentOwner, content, userRemote, mentionedRemoteUsers) {
  try {
    await fetch(userRemote.webmention_url, {
      method: 'POST',
      body: new URLSearchParams({
        source: content.url,
        target: content.thread || userRemote.profile_url,
      }),
    });
  } catch (ex) {
    // Not a big deal if this fails.
    // TODO(mime): add logging later.
  }
}

export default (options) => async (req, res) => {
  if (!req.query.resource || !req.body.source || !req.body.target) {
    return res.sendStatus(400);
  }
  const user = await options.getLocalUser(req.query.resource, req);
  if (!user) {
    return res.sendStatus(404);
  }

  await handleMention(req, options, user, req.body.source, req.body.target);
  res.sendStatus(202);
};

async function handleMention(req, options, user, sourceUrl, targetUrl) {
  const html = await fetchText(sourceUrl);
  const $ = cheerio.load(html);

  if (!$('.h-entry')) {
    return;
  }

  const userRemoteInfo = await getUserRemoteInfo(sourceUrl, user.username);
  let userRemote = await options.getRemoteUser(userRemoteInfo.username, userRemoteInfo.profile_url);
  if (!userRemote) {
    await options.saveRemoteUser(userRemoteInfo);
    userRemote = await options.getRemoteUser(user.username, userRemoteInfo.profile_url);
  }

  const localContent = await options.getLocalContent(targetUrl, req);

  const existingModelEntry = await options.getRemoteContent(user.username, sourceUrl);
  await options.saveRemoteContent(Object.assign({}, existingModelEntry?.dataValues, {
    id: existingModelEntry?.id || undefined,
    avatar: userRemote.avatar,
    date_created: new Date($('.h-entry .t-published').attr('datetime') || new Date()),
    date_updated: new Date($('.h-entry .t-updated').attr('datetime') || new Date()),
    from_user: userRemote.profile_url,
    from_user_remote_id: userRemote.id,
    creator: userRemote.name,
    link: sourceUrl,
    local_content_name: localContent?.name,
    post_id: sourceUrl,
    title: $('.h-entry .p-name').first().text() || $('.h-entry .p-summary').first().text(),
    to_username: user.username,
    type: 'comment',
    username: userRemote.username,
    view: sanitizeHTML($('.h-entry .e-content').html()),
  }));

  emailMention(req, user.username, undefined /* fromEmail */, user.email, sourceUrl);
}
