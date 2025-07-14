import { buildUrl } from 'util/url-factory';
import auth0 from 'vendor/auth0';
import prisma from 'data/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { follow } from 'social-butterfly/follow';
import { renderToString } from 'util/react-dom';

export const GET = async (req: NextRequest) => {
  const session = await auth0.getSession();
  let currentUser;
  if (session) {
    currentUser = await prisma.user.findUnique({ where: { email: session?.user.email } });
  }
  if (!currentUser) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 400 });
  }

  return NextResponse.json(
    `<!doctype html>` +
      renderToString(<FollowConfirm req={req} resource={req.nextUrl.searchParams.get('resource') as string} />)
  );
};

export const POST = async (req: NextRequest) => {
  const session = await auth0.getSession();
  let currentUser;
  if (session) {
    currentUser = await prisma.user.findUnique({ where: { email: session?.user.email } });
  }
  if (!currentUser) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 400 });
  }

  await follow(req, currentUser, req.nextUrl.searchParams.get('resource') as string);
  return NextResponse.redirect('/');
};

function FollowConfirm({ req, resource }: { req: NextRequest; resource: string }) {
  const actionUrl = buildUrl({ pathname: '/api/social/follow', searchParams: { resource } });

  // TODO(mime): good candidate to make a `SimpleHTMLBase` template.
  // TODO(mime): add i18n
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Confirm follow request</title>
      </head>
      {/* eslint-disable-next-line */}
      <link rel="stylesheet" href="/css/themes/pixel.css" />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
              'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
              'Droid Sans', 'Helvetica Neue', sans-serif;
            font-size: 13px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }

          button {
            font-size: 24px;
            float: none;
            outline: 0 !important;
          }
        `,
        }}
      />

      <body>
        <h1>{`Confirm Follow: ${req.url}`}</h1>
        <form action={actionUrl} method="post">
          <button type="submit">Follow</button>
        </form>
      </body>
    </html>
  );
}
