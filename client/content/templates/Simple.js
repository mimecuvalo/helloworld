import classNames from 'classnames';
import Editor from '../../editor';
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

    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: content.style }} />
        <div dangerouslySetInnerHTML={{ __html: content.code }} />
        {isEditing || content.content ? (
          <div className={classNames(styles.view, 'hw-view')}>
            <Editor ref={this.editor} readOnly={!isEditing} content={content} />
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: content.view }} className={classNames(styles.view, 'hw-view')} />
        )}
      </>
    );
  }
}
