import { NextResponse } from 'next/server';

// TODO(mime): websub / pubsubhubbub doesn't work on next.js - figure something else
export const POST = async () => new NextResponse('OK', { status: 200 });

// TODO(mime): Implement WebSub functionality
// const webSubSubscriber = pubSubHubBub.createServer({
//   callbackUrl: '/fakeCallbackUrl', // This is overridden when we call subscribe/unsubscribe. We need the host.
//   secret: options.constants.pushSecret,
// });

// // TODO(mime): verify this is working correctly and remove console.log.
// webSubSubscriber.on('feed', async ({ topic, hub, callback, feed, headers }) => {
//   console.log('WebSub feed: ', topic, hub, callback, feed, headers);

//   const searchParams = new URL(callback).searchParams;
//   const remoteUser = await options.getRemoteUser(
//     searchParams.get('localUsername'),
//     searchParams.get('remoteProfileUrl')
//   );
//   await parseFeedAndInsertIntoDb(options, remoteUser, feed);
// });

// webSubSubscriber.on('error', (err) => {
//   console.log('WebSub error', err);
// });

// webSubSubscriber.on('subscribe', (data) => {
//   console.log('WebSub subscribed: ', data);
// });

// webSubSubscriber.on('unsubscribe', (data) => {
//   console.log('WebSub unsubscribed: ', data);
// });

// webSubSubscriber.on('denied', (data) => {
//   console.log('WebSub denied: ', data);
// });

// return webSubSubscriber;
