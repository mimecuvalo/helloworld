/* eslint-disable */
const CircularDependencyPlugin = require('circular-dependency-plugin');
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
const { withSentryConfig } = require('@sentry/nextjs');
const webpack = require('webpack');

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: ['i.creativecommons.org', 's3.amazonaws.com', process.env.S3_AWS_S3_BUCKET_NAME].filter((i) => !!i),
    minimumCacheTTL: 60,
  },

  compiler: {
    styledComponents: true,
  },

  experimental: {
    scrollRestoration: true,
  },

  // N.B. This is super important so that our bundles don't slow down the whole site.
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },

  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  },

  // N.B. Production builds complain that this is not allowed (warning in Next.js version 13)
  // However, it's ok for now. In the future, Sentry v8 will make this the default, it will
  // be safe to remove then.
  sentry: {
    hideSourceMaps: true,
  },

  async redirects() {
    return [
      {
        source: '/resource/:path*',
        destination: `https://${process.env.S3_AWS_S3_BUCKET_NAME}/:path*`,
        permanent: false,
      },
      {
        source: '/.well-known/host-meta',
        destination: '/api/social/.well-known/host-meta',
        permanent: false,
      },
      {
        source: '/.well-known/webfinger',
        destination: '/api/social/.well-known/webfinger',
        permanent: false,
      },
    ];
  },

  webpack: (config, { dev, buildId, ...other }) => {
    config.plugins.push(
      new CircularDependencyPlugin({
        // exclude detection of files based on a RegExp
        exclude: /node_modules/,
        // include specific files based on a RegExp
        //include: /client|server|shared/,
        // add errors to webpack instead of warnings
        failOnError: true,
        // allow import cycles that include an asyncronous import,
        // e.g. via import(/* webpackMode: "weak" */ './file.js')
        allowAsyncCycles: false,
        // set the current working directory for displaying module paths
        cwd: process.cwd(),
      })
    );

    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.BUILD_ID': JSON.stringify(buildId),
        'process.env.NEXT_PUBLIC_VERCEL_GITHUB_COMMIT_SHA': process.env.VERCEL_GITHUB_COMMIT_SHA,
      })
    );

    if (!dev) {
      // TODO(mime): try to re-enable this but with SWC it was breaking, was only working with Babel.
      // https://formatjs.io/docs/guides/advanced-usage#react-intl-without-parser-40-smaller
      // config.resolve.alias['@formatjs/icu-messageformat-parser'] = '@formatjs/icu-messageformat-parser/no-parser';
    }

    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer-when-downgrade',
          },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
