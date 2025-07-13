import { Content, User, UserRemote } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
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

export default async function webmention(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const resource = req.nextUrl.searchParams.get('resource');
  if (!resource) {
    return NextResponse.json({ error: 'Resource parameter required' }, { status: 400 });
  }

  const contentType = req.headers.get('content-type');
  let body: { source?: string; target?: string } = {};

  if (contentType?.includes('application/x-www-form-urlencoded')) {
    const formData = await req.formData();
    body = {
      source: formData.get('source')?.toString(),
      target: formData.get('target')?.toString(),
    };
  } else if (contentType?.includes('application/json')) {
    body = await req.json();
  } else {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  }

  if (!body.source || !body.target) {
    return NextResponse.json({ error: 'Source and target parameters required' }, { status: 400 });
  }

  console.debug(`Received webmention: resource: ${resource}, source: ${body.source}, target: ${body.target}`);

  const user = await getLocalUser(resource);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await handleMention(req, user, body.source, body.target);
  return NextResponse.json({ success: true }, { status: 202 });
}

export async function reply(
  req: NextRequest,
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

async function handleMention(req: NextRequest, user: User, sourceUrl: string, targetUrl: string) {
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
