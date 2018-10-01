import Button from '@material-ui/core/Button';
import { defineMessages, F, injectIntl } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import logo from './logo.svg';
import React, { PureComponent } from 'react';

const messages = defineMessages({
  greeting: { msg: 'logo' },
});

// This is an Apollo/GraphQL decorator for the Home component which passes the query result to the props.
@graphql(gql`
  {
    hello
  }
`)
class Home extends PureComponent {
  render() {
    const logoAltText = this.props.intl.formatMessage(messages.greeting);

    return (
      <div>
        <img src={logo} className="App-logo" alt={logoAltText} />
        <p>
          <F
            msg="Edit {code} and save to reload."
            values={{
              code: <code>src/App.js</code>,
            }}
          />
        </p>
        <Button
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          color="primary"
        >
          <F msg="Learn React" />
        </Button>

        <br />
        <br />

        <Button
          href="https://graphql.org/"
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          color="primary"
        >
          <F msg="Learn {data}" values={{ data: this.props.data.hello }} />
        </Button>
        <br />
        <F
          msg="Translation number test: {itemCount, plural, =0 {no items} one {# item} other {# items}}."
          values={{
            itemCount: 5000,
          }}
        />
      </div>
    );
  }
}

export default injectIntl(Home);
