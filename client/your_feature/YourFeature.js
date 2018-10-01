import { F } from '../../shared/i18n';
import { Route, Link } from 'react-router-dom';
import React, { PureComponent } from 'react';

/**
 * Provides a simple React component as an example React component to manipulate out-of-the-box.
 * Has an example of some React routing.
 */
export default class YourFeature extends PureComponent {
  render() {
    return (
      <div>
        <h2>
          <F msg="Your Feature" />
        </h2>
        <ul>
          <li>
            <Link to={`${this.props.match.url}/rendering`}>
              <F msg="Rendering with React" />
            </Link>
          </li>
          <li>
            <Link to={`${this.props.match.url}/components`}>
              <F msg="Components" />
            </Link>
          </li>
          <li>
            <Link to={`${this.props.match.url}/props-v-state`}>
              <F msg="Props vs. State" />
            </Link>
          </li>
        </ul>

        <Route path={`${this.props.match.path}/:topicId`} component={Topic} />
        <Route
          exact
          path={this.props.match.path}
          render={() => (
            <h3>
              <F msg="Please select a topic." />
            </h3>
          )}
        />
      </div>
    );
  }
}

class Topic extends PureComponent {
  render() {
    return (
      <div>
        <h3>{this.props.match.params.topicId}</h3>
      </div>
    );
  }
}
