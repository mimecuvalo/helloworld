import type {} from '@testing-library/jest-dom/vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// Not `import '@testing-library/jest-dom/vitest'`: that entry imports `vitest`
// without declaring it, which doesn't resolve under bun's global store.
expect.extend(matchers);
