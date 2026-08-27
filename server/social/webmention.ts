import type { ContentRemote, User } from '../../generated/prisma/client';
import { fetchText, sanitizeHTML } from '../crawler';
import { getLocalContent, getRemoteContent, getRemoteUser, saveRemoteContent, saveRemoteUser } from './db';
import * as cheerio from 'cheerio';
import { getUserRemoteInfo } from './discover-user';

export async function handleMention(user: User, sourceUrl: string, targetUrl: string) {
  const html = await fetchText(sourceUrl);
  const $ = cheerio.load(html);
  if (!$('.h-entry').length) {
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
      id: existingModelEntry?.id || -1,
      avatar: userRemote.avatar,
      createdAt: new Date($('.h-entry .t-published').attr('datetime') || new Date()),
      updatedAt: new Date($('.h-entry .t-updated').attr('datetime') || new Date()),
      fromUsername: userRemote.profileUrl,
      fromUserRemoteId: userRemote.id.toString(),
      creator: userRemote.name,
      link: sourceUrl,
      localContentName: localContent?.name,
      postId: sourceUrl,
      title: $('.h-entry .p-name').first().text() || $('.h-entry .p-summary').first().text(),
      toUsername: user.username,
      type: 'comment',
      username: userRemote.username,
      view: sanitizeHTML($('.h-entry .e-content').html() || ''),
    }) as ContentRemote
  );
}
