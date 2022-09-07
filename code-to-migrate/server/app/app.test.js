import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import serverRender from './App';

it('renders server without crashing', () => {
  serverRender({
    req: { url: '/' },
    // TODO(mime): replace with a proper mock.
    res: { write: () => {}, on: () => {}, once: () => {}, emit: () => {} },
  });
});
