import classNames from 'classnames';
import ContentEditor from '../ContentEditor';
import Editor from '../../editor';
import ErrorBoundary from '../../error/ErrorBoundary';
import React, { PureComponent } from 'react';
import styles from './Simple.module.css';

export default class Simple extends PureComponent {
  constructor(props) {
    super(props);

    this.editor = React.createRef();
  }

  getEditor() {
    return this.editor.current;
  }

  render() {
    const { content, isEditing } = this.props;

    if (isEditing) {
      return <ContentEditor ref={this.editor} content={content} />;
    }

    return (
      <>
        {this.props.isFeed ? null : <div dangerouslySetInnerHTML={{ __html: content.style }} />}
        {this.props.isFeed ? null : <div dangerouslySetInnerHTML={{ __html: content.code }} />}

        {content.content ? (
          <div className={classNames(styles.view, 'hw-view')}>
            <ErrorBoundary>
              <Editor readOnly={true} content={content} />
            </ErrorBoundary>
          </div>
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: content.view }}
            className={classNames('e-content', styles.view, 'hw-view')}
          />
        )}
      </>
    );
  }
}
