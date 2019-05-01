import constants from '../../../shared/constants';
import { contentUrl } from '../../../shared/util/url_factory';
import fetch from 'node-fetch';

export default async function socialize(content, req, opt_isComment) {
  if (content.hidden) {
    return;
  }

  await pubsubhubbubPush(content, req);

  // TODO(mime):
  // if (opt_isComment) {
  //   smtp.comment(self, from_username, post_remote.from_user,
  //       commented_user.email, self.content_url(commented_content, host=True),
  //       sanitized_comment)
  // }
}

async function pubsubhubbubPush(content, req) {
  try {
    const contentFeedUrl = contentUrl(content, req);
    await fetch(constants.pushHub, {
      method: 'POST',
      body: new URLSearchParams({ 'hub.url': contentFeedUrl, 'hub.mode': 'publish' }),
    });
  } catch (ex) {
    // Not a big deal if this fails.
  }
}
