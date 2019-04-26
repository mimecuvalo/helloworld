import models from '../../data/models';
import { parseFeedAndInsertIntoDb } from '../../util/feeds';
import pubSubHubBub from 'pubsubhubbub';

const pubSubHubSubscriber = pubSubHubBub.createServer({
  callbackUrl: '/fakeCallbackUrl', // This is overridden when we call subscribe/unsubscribe. We need the host.
  secret: process.env.REACT_APP_PUSH_SECRET,
});

// TODO(mime): verify this is working correctly and remove console.log.
pubSubHubSubscriber.on('feed', async ({ topic, hub, callback, feed, headers }) => {
  console.log('push feed: ', topic, hub, callback, feed, headers);

  const searchParams = new URL(callback).searchParams;
  const userRemote = await models.User_Remote.findOne({
    where: { local_username: searchParams.get('local_username'), profile_url: searchParams.get('profile_url') },
  });

  await parseFeedAndInsertIntoDb(userRemote, feed);
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

export default pubSubHubSubscriber;
