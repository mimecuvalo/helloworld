import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import viteReact from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

const abs = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^components$/, replacement: abs('./components/index.tsx') },
      { find: /^components\/(.*)$/, replacement: abs('./components/$1') },
      { find: /^util\/(.*)$/, replacement: abs('./util/$1') },
      { find: /^lib\/(.*)$/, replacement: abs('./lib/$1') },
      { find: /^server\/(.*)$/, replacement: abs('./server/$1') },
      { find: /^i18n$/, replacement: abs('./i18n/index.ts') },
      { find: /^i18n\/(.*)$/, replacement: abs('./i18n/$1') },
      { find: /^styles$/, replacement: abs('./styles') },
      { find: /^hooks$/, replacement: abs('./hooks') },
    ],
  },
  plugins: [
    viteReact(),
    babel({
      plugins: [
        [
          'formatjs',
          { idInterpolationPattern: '[md5:contenthash:hex:10]', additionalComponentNames: ['F'], ast: true },
        ],
      ],
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
  },
});
