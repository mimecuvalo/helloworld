/* eslint-disable */
// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

import * as useExperiment from 'hooks/useExperiment';

import fetch from 'cross-fetch';

const spy = jest.spyOn(useExperiment, 'default');
spy.mockReturnValue(false);
global.fetch = fetch;
