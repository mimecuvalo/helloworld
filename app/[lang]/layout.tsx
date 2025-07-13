import { Inter, Oswald, Noto_Color_Emoji, Geist_Mono } from 'next/font/google';
import { ReactNode, StrictMode } from 'react';
import { Metadata } from 'next';
import { muiTheme } from 'styles';
import classNames from 'classnames';
import crypto from 'crypto';
import { v4 } from 'uuid';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoColorEmoji = Noto_Color_Emoji({ subsets: ['emoji'], weight: '400', variable: '--noto-color-emoji' });

// If loading a variable font, you don't need to specify the font weight
const oswald = Oswald({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const HOSTNAME = 'www.example.com';
const SITE_NAME = 'Hello World';

// Generate CSP nonce for this request
function generateNonce(): string {
  const hash = crypto.createHash('sha256');
  hash.update(v4());
  return hash.digest('base64');
}

// Generate CSP header
function generateCsp(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const cspDirectives: { [key: string]: string[] } = {
    'connect-src': isDevelopment
      ? ['*']
      : ["'self'", 'https://*.ingest.sentry.io', 'https://vitals.vercel-insights.com'],
    'default-src': ["'self'"],
    'font-src': ["'self'", 'https:'],
    'frame-src': ["'self'", 'http:', 'https:'],
    'img-src': ['data:', 'http:', 'https:'],
    'manifest-src': ["'self'"],
    'media-src': ["'self'", 'blob:'],
    'object-src': ["'self'"],
    'script-src': [
      "'self'",
      'https://cdn.auth0.com',
      'https://cdn.vercel-insights.com',
      'https://va.vercel-scripts.com',
    ].concat(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : [`'nonce-${nonce}'`]),
    'style-src': ["'self'", 'https:', "'unsafe-inline'"],
  };

  if (!isDevelopment) {
    cspDirectives['upgrade-insecure-requests'] = [];
  }

  const csp = Object.keys(cspDirectives)
    .map((directive) => `${directive} ${cspDirectives[directive].join(' ')}`)
    .join('; ');

  return csp;
}

export const metadata: Metadata = {
  title: SITE_NAME,
  description: 'hello, world. a federated blog with feed reader.',
  generator: 'all-the-things. https://github.com/mimecuvalo/all-the-things',
  metadataBase: new URL(`https://${HOSTNAME}`),
  openGraph: {
    title: SITE_NAME,
    description: 'hello, world. a federated blog with feed reader.',
    type: 'website',
    url: `https://${HOSTNAME}`,
    siteName: SITE_NAME,
    images: [
      {
        url: '/favicon.jpg',
        width: 32,
        height: 32,
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon.jpg', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.jpg',
  },
  manifest: '/manifest.json',
  authors: [{ name: 'John Doe', url: '/humans.txt' }],
  other: {
    'theme-color': muiTheme.palette.primary.main,
  },
};

// Generate static params for supported locales
export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'fr' }];
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Generate nonce for this request
  const nonce = generateNonce();
  const csp = generateCsp(nonce);

  return (
    <StrictMode>
      <html lang={lang}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
          <meta name="theme-color" content={muiTheme.palette.primary.main} />
          <meta property="csp-nonce" content={nonce} />
          <meta httpEquiv="Content-Security-Policy" content={csp} />
          <link rel="icon" href="/favicon.jpg" sizes="32x32" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/favicon.jpg" />
          <link rel="author" href="/humans.txt" />
          <link rel="search" href="/api/opensearch" type="application/opensearchdescription+xml" title={SITE_NAME} />

          <script
            nonce={nonce}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'http://schema.org',
                '@type': 'NewsArticle',
                mainEntityOfPage: {
                  '@type': 'WebPage',
                  '@id': `https://${HOSTNAME}`,
                },
                headline: 'hello, world',
                image: ['https://example.com/photos/16x9/photo.jpg'],
                datePublished: '2015-02-05T08:00:00+08:00',
                dateModified: '2015-02-05T09:20:00+08:00',
                author: {
                  '@type': 'Person',
                  name: 'John Doe',
                },
                publisher: {
                  '@type': 'Organization',
                  name: SITE_NAME,
                  logo: {
                    '@type': 'ImageObject',
                    url: `https://${HOSTNAME}/favicon.jpg`,
                  },
                },
                description: 'hello, world. a federated blog with feed reader.',
              }),
            }}
          />
        </head>
        <body className={classNames(oswald.variable, inter.variable, notoColorEmoji.variable, geistMono.variable)}>
          <Providers nonce={nonce} lang={lang}>
            {children}
          </Providers>

          <WindowErrorScript nonce={nonce} />
        </body>
      </html>
    </StrictMode>
  );
}

// If there is an error that occurs upon page load, i.e. when executing the initial app code,
// then we send the error up to the server via this mechanism.
// Once the app is loaded, then the rest of error reporting goes through error.js -> logError.
function WindowErrorScript({ nonce }: { nonce: string }) {
  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `
          window.addEventListener('error', function(event) {
            fetch('/api/report-error', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack,
              }),
            });
          });
        `,
      }}
    />
  );
}
