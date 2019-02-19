import { defineMessages, injectIntl } from '../../shared/i18n';
import React, { PureComponent } from 'react';

const messages = defineMessages({
  avatar: { msg: 'user avatar' },
});

class Avatar extends PureComponent {
  constructor() {
    super();

    this.state = {
      src: '/img/pixel.gif',
    };
  }

  componentDidMount() {
    const img = new Image();
    img.onload = () => img.naturalWidth && this.setState({ src: this.props.src });
    img.src = this.props.src;
  }

  render() {
    return <img src={this.state.src} alt={this.props.intl.formatMessage(messages.avatar)} />;
  }
}

export default injectIntl(Avatar);
