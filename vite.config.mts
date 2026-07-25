import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { config as loadEnv } from 'dotenv';
import { nitro } from 'nitro/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';
import viteReact from '@vitejs/plugin-react';
import formatjs from '@formatjs/unplugin/vite';

const isProd = process.env.NODE_ENV === 'production';
const clientSentryDsn = process.env.VITE_SENTRY_DSN || process.env.SENTRY_DSN || '';
const abs = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Load env for the dev/build server process. The vite dev server (unlike the
// Prisma CLI) doesn't read prisma/.env, so `bun run dev` had no DATABASE_URL and
// the pg adapter fell back to a local default DB. dotenv does NOT override vars
// already in the environment, so `dev:local`'s inline DATABASE_URL still wins,
// and `.env.local` overrides `prisma/.env` for anyone who wants that.
loadEnv({ path: abs('./.env.local') });
loadEnv({ path: abs('./.env') });
loadEnv({ path: abs('./prisma/.env') });

// Explicit path aliases (mirrors tsconfig `paths`). Done here rather than via
// vite-tsconfig-paths so alias resolution works for ALL files regardless of the
// tsconfig `include` set — otherwise the plugin only rewrites imports for files
// inside `include`, which breaks incrementally-ported components.
const alias = [
  { find: /^i18n$/, replacement: abs('./i18n/index.ts') },
  { find: /^i18n\/(.*)$/, replacement: abs('./i18n/$1') },
  { find: /^components$/, replacement: abs('./components/index.tsx') },
  { find: /^components\/(.*)$/, replacement: abs('./components/$1') },
  { find: /^server\/(.*)$/, replacement: abs('./server/$1') },
  { find: /^lib\/(.*)$/, replacement: abs('./lib/$1') },
  { find: /^styles$/, replacement: abs('./styles/index.ts') },
  { find: /^styles\/(.*)$/, replacement: abs('./styles/$1') },
  // Exclude Node's `util/types` builtin (used by pg) so it isn't rewritten to
  // the local ./util dir — that misresolution broke the server/Nitro build.
  { find: /^util\/(?!types$)(.+)$/, replacement: abs('./util/$1') },
  { find: /^hooks$/, replacement: abs('./hooks') },
  { find: /^data$/, replacement: abs('./data') },
  { find: /^data\/(.*)$/, replacement: abs('./data/$1') },
  { find: /^social-butterfly$/, replacement: abs('./social-butterfly') },
  { find: /^social-butterfly\/(.*)$/, replacement: abs('./social-butterfly/$1') },
  { find: /^prisma\/(.*)$/, replacement: abs('./prisma/$1') },
  { find: /^app\/(.*)$/, replacement: abs('./application/$1') },
  { find: /^@\/(.*)$/, replacement: abs('./$1') },
];

const sentryPlugins =
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
    ? [
        sentryTanstackStart({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
      ]
    : [];

export default defineConfig({
  server: { port: 3000 },
  define: {
    'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(clientSentryDsn),
  },
  resolve: { alias },
  // Server-only DB stack (reached via createServerFn → Prisma adapter). The
  // TanStack server-fn transform strips these from the client graph at build,
  // but the dev dep-optimizer scan follows the import and chokes on pg's
  // `require('util/types')`. Excluding them keeps the scan off the server deps.
  optimizeDeps: { exclude: ['pg', '@prisma/adapter-pg'] },
  ssr: { external: ['pg', '@prisma/adapter-pg'] },
  plugins: [
    tanstackStart({
      srcDirectory: '.',
      router: { routesDirectory: 'routes' },
    }),
    // Compiles the server into a deployable output (.output locally; Vercel's
    // Build Output API when VERCEL=1). Required for Vercel/Node deployment —
    // without it, `vite build` only emits a raw dist/ that Vercel can't serve.
    // serverEntry:false — our root server.ts IS the SSR render entry (Sentry-
    // wrapped); tell Nitro not to also treat it as a separate custom server
    // entry (it would otherwise warn and disable it anyway).
    nitro({ serverEntry: false }),
    ...sentryPlugins,
    formatjs({
      idInterpolationPattern: '[md5:contenthash:hex:10]',
      additionalComponentNames: ['F'],
      ast: true,
      flatten: true,
      removeDefaultMessage: isProd,
    }),
    viteReact(),
  ],
});
