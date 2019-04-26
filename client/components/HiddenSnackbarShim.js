import { injectIntl } from '../../shared/i18n';
import { PureComponent } from 'react';
import { withSnackbar } from 'notistack';

// XXX(mime): Sigh. I need to be able to put a ref sometimes on a component to access functionality. However,
// I can't use refs if the withSnackbar/injectIntl wrappers are present. Because they are not classes React will
// not be able to attach a ref to them. So this is the next best thing. LAME.
@withSnackbar
@injectIntl
class HiddenSnackbarShim extends PureComponent {
  componentDidUpdate(prevProps, prevState) {
    if (this.props.message) {
      this.props.enqueueSnackbar(this.props.intl.formatMessage(this.props.message), { variant: this.props.variant });
    }
  }

  render() {
    return null;
  }
}

export default HiddenSnackbarShim;
