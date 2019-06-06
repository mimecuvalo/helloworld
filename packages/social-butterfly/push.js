import { parseFeedAndInsertIntoDb } from './util/feeds';
import pubSubHubBub from 'pubsubhubbub';

export default function setupPush(options) {
  const pubSubHubSubscriber = pubSubHubBub.createServer({
    callbackUrl: '/fakeCallbackUrl', // This is overridden when we call subscribe/unsubscribe. We need the host.
    secret: options.constants.pushSecret,
  });

  // TODO(mime): verify this is working correctly and remove console.log.
  pubSubHubSubscriber.on('feed', async ({ topic, hub, callback, feed, headers }) => {
    console.log('push feed: ', topic, hub, callback, feed, headers);

    const searchParams = new URL(callback).searchParams;
    const remoteUser = await getRemoteUser(searchParams.get('localUsername'), searchParams.get('remoteProfileUrl'));
    await parseFeedAndInsertIntoDb(options, remoteUser, feed);
  });

  pubSubHubSubscriber.on('error', err => {
    console.log('push error', err);
  });

  pubSubHubSubscriber.on('subscribe', data => {
    console.log('push subscribed: ', data);
  });

  pubSubHubSubscriber.on('unsubscribe', data => {
    console.log('push unsubscribed: ', data);
  });

  pubSubHubSubscriber.on('denied', data => {
    console.log('push denied: ', data);
  });

  return pubSubHubSubscriber;
}
