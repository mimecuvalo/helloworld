import { F } from '../../shared/i18n';
import { logError } from './error';
import React, { PureComponent } from 'react';

// See React's documentation: https://reactjs.org/docs/error-boundaries.html
export default class ErrorBoundary extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    this.setState({ hasError: true });
    logError({ message: error.message, stack: error.stack, info });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <h1>
          <F msg="Something went wrong." />
        </h1>
      );
    }
    return this.props.children;
  }
}
