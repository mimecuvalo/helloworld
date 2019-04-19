import { buildUrl, contentUrl } from '../../shared/util/url_factory';
import classNames from 'classnames';
import { compose, graphql } from 'react-apollo';
import ContentBase from './ContentBase';
import ContentQuery from './ContentQuery';
import Feed from './Feed';
import gql from 'graphql-tag';
import Item from './Item';
import Nav from './Nav';
import NotFound from '../error/404';
import React, { Component } from 'react';
import Simple from './templates/Simple';
import styles from './Content.module.css';
import { withRouter } from 'react-router-dom';

@withRouter
class Content extends Component {
  constructor(props) {
    super(props);

    this.item = React.createRef();

    this.state = {
      isEditing: false,
    };
  }

  componentDidMount() {
    if (this.props.data.loading || !this.props.data.fetchContent) {
      return;
    }

    const canonicalUrl = contentUrl(this.props.data.fetchContent);
    const absoluteCanonicalUrl = buildUrl({ isAbsolute: true, pathname: canonicalUrl });
    const parsedCanonicalUrl = new URL(absoluteCanonicalUrl);
    const currentWindowUrl = new URL(window.location.href);
    if (currentWindowUrl.pathname !== parsedCanonicalUrl.pathname) {
      this.props.history.replace(canonicalUrl);
    }
  }

  shouldComponentUpdate(nextProps) {
    return !nextProps.data.loading;
  }

  handleEdit = evt => {
    evt.preventDefault();

    if (this.state.isEditing) {
      this.saveContent();
    }

    this.setState({ isEditing: !this.state.isEditing }, () => {
      this.item.current.getEditor() && this.item.current.getEditor().setUnsavedChanges(!this.state.isEditing);
    });
  };

  async saveContent() {
    const { username, name } = this.props.data.fetchContent;
    const editor = this.item.current.getEditor();
    const content = editor.export();
    const variables = {
      username,
      name,
      content: JSON.stringify(content.content),
      style: content.style,
      code: content.code,
    };

    await this.props.mutate({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        saveContent: Object.assign({}, variables, { __typename: 'Content' }),
      },
    });
  }

  render() {
    if (this.props.data.loading) {
      return null;
    }

    const content = this.props.data.fetchContent;

    if (!content) {
      return <NotFound />;
    }

    if (content.template === 'blank') {
      return (
        <div id="hw-content">
          <Simple content={content} />
        </div>
      );
    }

    const isEditing = this.state.isEditing;
    const contentOwner = this.props.data.fetchPublicUserData;
    const item =
      content.template === 'feed' ? (
        <Feed content={content} />
      ) : (
        <Item content={content} handleEdit={this.handleEdit} isEditing={isEditing} ref={this.item} />
      );
    const title = (content.title ? content.title + ' – ' : '') + contentOwner.title;

    return (
      <ContentBase content={content} contentOwner={contentOwner} title={title} username={content.username}>
        <article className={classNames(styles.content, 'hw-invisible-transition')}>
          {isEditing ? null : <Nav content={content} />}
          {item}
        </article>
      </ContentBase>
    );
  }
}

export default compose(
  graphql(ContentQuery, {
    options: ({
      match: {
        params: { username, name },
      },
    }) => ({
      variables: {
        username: username || '',
        name: username ? name || 'home' : '',
      },
    }),
  }),
  graphql(gql`
    mutation saveContent($name: String!, $style: String!, $code: String!, $content: String!) {
      saveContent(name: $name, style: $style, code: $code, content: $content) {
        username
        name
        style
        code
        content
      }
    }
  `)
)(Content);
