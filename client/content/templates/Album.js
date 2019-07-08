import classNames from 'classnames';
import { compose, graphql } from 'react-apollo';
import ContentLink from '../../components/ContentLink';
import ContentThumb from '../../components/ContentThumb';
import { defineMessages, F, injectIntl } from '../../../shared/i18n';
import gql from 'graphql-tag';
import React, { PureComponent } from 'react';
import styles from './Album.module.css';
import { withSnackbar } from 'notistack';

const messages = defineMessages({
  error: { msg: 'Error deleting content.' },
});

const FetchCollection = gql`
  query($username: String!, $section: String!, $album: String!, $name: String!) {
    fetchCollection(username: $username, section: $section, album: $album, name: $name) {
      album
      externalLink
      forceRefresh
      hidden
      name
      section
      thumb
      title
      username
    }
  }
`;

@injectIntl
@withSnackbar
class Album extends PureComponent {
  handleClick = async item => {
    const variables = { name: item.name };

    try {
      await this.props.mutate({
        variables,
        optimisticResponse: {
          __typename: 'Mutation',
          deleteContent: true,
        },
        update: (store, { data: { deleteContent } }) => {
          const { username, section, album, name } = this.props.content;
          const queryVariables = { username, section, album, name };
          const data = store.readQuery({ query: FetchCollection, variables: queryVariables });
          store.writeQuery({
            query: FetchCollection,
            data: { fetchCollection: data.fetchCollection.filter(i => i.name !== item.name) },
            variables: queryVariables,
          });
        },
      });
    } catch (ex) {
      this.props.enqueueSnackbar(this.props.intl.formatMessage(messages.error), { variant: 'error' });
    }
  };

  render() {
    if (this.props.data.loading) {
      return <div className={styles.loadingEmptyBox} />;
    }

    const content = this.props.content;
    const collection = this.props.data.fetchCollection;

    return (
      <ul className={styles.album}>
        {!collection.length && (
          <li>
            <F msg="No content here yet." />
          </li>
        )}
        {collection.map(item => (
          <li key={item.name} className={styles.item}>
            {this.props.isEditing ? (
              <button
                className={classNames('hw-button', 'hw-delete', styles.delete)}
                onClick={() => {
                  this.handleClick(item);
                }}
              >
                x
              </button>
            ) : null}
            <ContentThumb item={item} currentContent={content} />
            {item.externalLink ? (
              <a
                className={classNames('hw-album-title', styles.title, styles.link)}
                href={item.externalLink}
                target="_blank"
                rel="noreferrer noopener"
              >
                {item.title}
              </a>
            ) : (
              <ContentLink
                item={item}
                currentContent={content}
                className={classNames('hw-album-title', styles.title, styles.link)}
              >
                {item.title}
              </ContentLink>
            )}
          </li>
        ))}
      </ul>
    );
  }
}

export default compose(
  graphql(FetchCollection, {
    options: ({ content: { username, section, album, name } }) => ({
      variables: {
        username,
        section,
        album,
        name,
      },
    }),
  }),
  graphql(gql`
    mutation deleteContent($name: String!) {
      deleteContent(name: $name)
    }
  `)
)(Album);
