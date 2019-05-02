import cheerio from 'cheerio';
import { contentUrl, parseContentUrl } from '../../../shared/util/url_factory';
import fetch from 'node-fetch';
import { fetchText } from '../../util/crawler';
import { mention as emailMention } from './email';
import models from '../../data/models';
import { parseUsernameFromAccount } from './discover_user';

export async function webmentionReply(req, userRemote, content, thread, mentionedRemoteUsers) {
  if (!userRemote.webmention_url) {
    return;
  }

  try {
    await fetch(userRemote.webmention_url, {
      method: 'POST',
      body: JSON.stringify({
        source: contentUrl(content, req),
        target: content.thread || userRemote.profile_url,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (ex) {
    // Not a big deal if this fails.
    // TODO(mime): add logging later.
  }
}

export default async (req, res) => {
  // TODO(mime): make sure xsrf check here is disabled.
  if (!req.query.q || !req.body.source || !req.body.target) {
    return res.sendStatus(400);
  }
  const username = parseUsernameFromAccount(req.query.q);
  const { name } = parseContentUrl(req.query.url);
  const user = await models.User.findOne({ where: { username } });
  const content = await models.Content.findOne({ where: { username, name } });
  if (!user || !content) {
    return res.sendStatus(404);
  }

  await handleMention(req, content, req.body.source, req.body.target);
  res.sendStatus(202);
};

async function handleMention(req, content, sourceUrl, targetUrl) {
  const html = await fetchText(sourceUrl);
  const $ = cheerio.load(html);

  if (!$('.h-entry')) {
    return;
  }

  const existingModelEntry = await models.Content_Remote.findOne({
    where: {
      to_username: content.username,
      from_user: sourceUrl, // XXX(mime): this can't be right...
      post_id: sourceUrl,
    },
  });
  await models.Content.update(
    {
      comments_count: content.comments_count + 1,
      comments_updated: new Date(),
    },
    {
      where: {
        username: content.username,
        name: content.name,
      },
    }
  );

  await models.Content_Remote.upsert({
    id: existingModelEntry?.id || undefined,
    avatar: '', // TODO(mime)
    date_created: new Date($('.h-entry .t-published').attr('datetime') || new Date()),
    date_updated: new Date($('.h-entry .t-updated').attr('datetime') || new Date()),
    from_user: sourceUrl, // XXX(mime): this can't be right...
    link: sourceUrl,
    local_content_name: content.name,
    post_id: sourceUrl,
    title: $('.h-entry .p-summary').text(),
    to_username: content.username,
    type: 'comment',
    username: 'Remote User', // TODO(mime)
    view: $('.h-entry .e-content').html(),
  });

  const user = await models.User.findOne({ where: { username: content.username } });

  emailMention(req, 'Remote User', sourceUrl /* XXX(mime): can't be right */, user.email, sourceUrl);
}
