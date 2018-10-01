import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <Router>
      <App />
    </Router>,
    div
  );
  ReactDOM.unmountComponentAtNode(div);
});
