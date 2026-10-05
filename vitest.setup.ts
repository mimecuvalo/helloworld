import type {} from '@testing-library/jest-dom/vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect, vi } from 'vitest';

// Not `import '@testing-library/jest-dom/vitest'`: that entry imports `vitest`
// without declaring it, which doesn't resolve under bun's global store.
expect.extend(matchers);

// safeFetch resolves every host before fetching; tests stub fetch itself, so
// keep them off real DNS by resolving everything to a public address.
vi.mock('node:dns/promises', () => {
  const lookup = vi.fn(async () => [{ address: '93.184.216.34', family: 4 }]);
  return { lookup, default: { lookup } };
});
