import { buildUrl } from './util/url_factory';
import React, { PureComponent } from 'react';

export default class Follow extends PureComponent {
  render() {
    const { req, resource } = this.props;
    const actionUrl = buildUrl({ pathname: '/api/social/follow', searchParams: { resource } });

    // TODO(mime): good candidate to make a `SimpleHTMLBase` template.
    // TODO(mime): add i18n
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <title>Confirm follow request</title>
        </head>
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

            button.hw-button {
              font-size: 24px;
              float: none;
              outline: 0 !important;
            }
          `,
          }}
        />

        <body>
          <h1>{`Confirm Follow: ${url}`}</h1>
          <form action={actionUrl} method="post">
            <input name="_csrf" type="hidden" value={req.csrfToken()} />
            <button className="hw-button hw-save" type="submit">
              Follow
            </button>
          </form>
        </body>
      </html>
    );
  }
}
