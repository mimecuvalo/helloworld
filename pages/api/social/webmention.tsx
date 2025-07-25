import { Content, User, UserRemote } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchText, sanitizeHTML } from 'util/crawler';
import {
  getLocalContent,
  getLocalUser,
  getRemoteContent,
  getRemoteUser,
  saveRemoteContent,
  saveRemoteUser,
} from 'social-butterfly/db';

import * as cheerio from 'cheerio';
import { contentUrl } from 'util/url-factory';
// import { mention as emailMention } from './email';
import { getUserRemoteInfo } from 'social-butterfly/discover-user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!req.query.resource || !req.body.source || !req.body.target) {
    return res.status(400).end();
  }
  console.debug(
    `Received webmention: resource: ${req.query.resource}, source: ${req.body.source}, target: ${req.body.target}`
  );
  const user = await getLocalUser(req.query.resource as string);
  if (!user) {
    return res.status(404).end();
  }

  await handleMention(req, user, req.body.source, req.body.target);
  res.status(202).end();
}

export async function reply(
  req: NextApiRequest,
  contentOwner: User,
  content: Content,
  userRemote: UserRemote,
  // eslint-disable-next-line
  mentionedRemoteUsers: UserRemote[]
) {
  try {
    await fetch(userRemote.webmentionUrl || '', {
      method: 'POST',
      body: new URLSearchParams({
        source: contentUrl(content, req),
        target: content.thread || userRemote.profileUrl,
      }),
    });
  } catch {
    // Not a big deal if this fails.
    // TODO(mime): add logging later.
  }
}

async function handleMention(req: NextApiRequest, user: User, sourceUrl: string, targetUrl: string) {
  const html = await fetchText(sourceUrl);
  const $ = cheerio.load(html);

  if (!$('.h-entry')) {
    return;
  }

  const userRemoteInfo = await getUserRemoteInfo(sourceUrl, user.username);
  let userRemote = await getRemoteUser(userRemoteInfo.username, userRemoteInfo.profileUrl);
  if (!userRemote) {
    await saveRemoteUser(userRemoteInfo);
    userRemote = await getRemoteUser(user.username, userRemoteInfo.profileUrl);
  }

  if (!userRemote) {
    throw new Error('user not found.');
  }

  const localContent = await getLocalContent(targetUrl);

  const existingModelEntry = await getRemoteContent(user.username, sourceUrl);
  await saveRemoteContent(
    Object.assign({}, existingModelEntry, {
      id: existingModelEntry?.id || undefined,
      avatar: userRemote.avatar,
      date_created: new Date($('.h-entry .t-published').attr('datetime') || new Date()),
      date_updated: new Date($('.h-entry .t-updated').attr('datetime') || new Date()),
      from_user: userRemote.profileUrl,
      from_user_remote_id: userRemote.id,
      creator: userRemote.name,
      link: sourceUrl,
      local_content_name: localContent?.name,
      post_id: sourceUrl,
      title: $('.h-entry .p-name').first().text() || $('.h-entry .p-summary').first().text(),
      to_username: user.username,
      type: 'comment',
      username: userRemote.username,
      view: sanitizeHTML($('.h-entry .e-content').html() || ''),
    })
  );

  //emailMention(req, user.username, undefined /* fromEmail */, user.email, sourceUrl);
}
