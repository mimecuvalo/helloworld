import { F } from 'react-intl-wrapper';
import { logError } from './error';
import { PureComponent } from 'react';

const styles = {
  errorBoundary: {
    border: '3px double #f00',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '10px',
    fontWeight: '400',
    color: '#f00',
  },
};

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
        <h1 style={styles.errorBoundary}>
          <F msg="Something went wrong. 😦" />
        </h1>
      );
    }
    return this.props.children;
  }
}
