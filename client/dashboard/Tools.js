import { F } from '../../shared/i18n';
import { profileUrl } from '../../shared/util/url_factory';
import React, { Component } from 'react';
import { setUser } from '../app/auth';
import UserContext from '../app/User_Context';

export default class Tools extends Component {
  static contextType = UserContext;

  constructor(props) {
    super(props);

    this.state = {
      origin: null,
    };
  }

  componentDidMount() {
    // TODO(mime): need an isomorphic mechanism for host. Haven't written it yet.
    // This is lame obvs.
    this.setState({
      origin: window.location.origin,
    });
  }

  handleLogout = evt => {
    setUser(undefined);
  };

  createBookmarklet(pathname) {
    return `
      javascript:void((function() {
        var e = document.createElement('script');
        var scriptUrl = '${this.state.origin}' + '${pathname}' + '?random=' + (Math.random() * 99999999);
        e.setAttribute('src', scriptUrl);
        document.body.appendChild(e)
      })())
    `;
  }

  render() {
    const username = this.context.user.model.username;
    const followScript = this.createBookmarklet('/js/helloworld_follow.js');
    const reblogScript = this.createBookmarklet('/js/helloworld_reblog.js');

    return (
      <ul className={this.props.className}>
        <li>
          <a href={profileUrl(username)} target="_blank" rel="noopener noreferrer">
            <F msg="view site" />
          </a>
        </li>
        <li>
          <a href={followScript}>
            <F msg="follow bookmarklet" />
          </a>
        </li>
        <li>
          <a href={reblogScript}>
            <F msg="reblog bookmarklet" />
          </a>
        </li>
        <li>
          <a href="/api/data-liberation">
            <F msg="data liberation" />
          </a>
        </li>
        <li>
          <button className="hw-button-link" onClick={this.handleLogout}>
            <F msg="logout" />
          </button>
        </li>
      </ul>
    );
  }
}
