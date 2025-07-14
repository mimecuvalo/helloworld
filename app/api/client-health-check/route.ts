import { NextRequest, NextResponse } from 'next/server';

/**
 * The app will periodically send up a signal to see if it's a valid client.
 * The client will provide information like its git commit hash id at time of release and time of release.
 * Based on this information, you can selectively disable clients that might be potentially harmful in the wild
 * either because of issues like DDOSing or data-loss-causing clients.
 *
 * Meant to be a path of last resort! It's jarring for a client to reset so only do this if as a stop-the-presses
 * option.
 */

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const buildId = searchParams.get('buildId');
  const commitSHA = searchParams.get('commitSHA');

  if (buildId === 'somebadid' || commitSHA === 'somebadid') {
    return new NextResponse('bad', { status: 200 });
  }

  // Otherwise, the client is good.
  return NextResponse.json(null, { status: 204 });
};
