import serverRender from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom';

it('renders server without crashing', () => {
  serverRender({
    req: { url: '/' },
    // TODO(mime): replace with a proper mock.
    res: { write: () => {}, on: () => {}, once: () => {}, emit: () => {} },
  });
});
