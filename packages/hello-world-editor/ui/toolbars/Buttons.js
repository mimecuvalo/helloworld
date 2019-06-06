import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import CodeIcon from '@material-ui/icons/Code';
import { defineMessages, injectIntl } from 'react-intl';
import FormatBoldIcon from '@material-ui/icons/FormatBold';
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
import FormatListNumberedIcon from '@material-ui/icons/FormatListNumbered';
import FormatQuoteIcon from '@material-ui/icons/FormatQuote';
import FormatSizeIcon from '@material-ui/icons/FormatSize';
import FormatStrikethroughIcon from '@material-ui/icons/FormatStrikethrough';
import InsertLinkIcon from '@material-ui/icons/InsertLink';
import PhotoIcon from '@material-ui/icons/Photo';
import React, { Component } from 'react';
import { RichUtils } from 'draft-js';
import styles from './Toolbar.module.css';
import uploadFiles from '../../media/attachment';
import { withSnackbar } from 'notistack';

const messages = defineMessages({
  bold: {
    id: 'hw-editor-toolbar-bold',
    defaultMessage: 'Bold',
  },
  bulleted: {
    id: 'hw-editor-toolbar-bulleted',
    defaultMessage: 'Start bulleted List',
  },
  code: {
    id: 'hw-editor-toolbar-code',
    defaultMessage: 'Add code',
  },
  errorMedia: {
    id: 'hw-editor-toolbar-error-media',
    defaultMessage: 'Error uploading image.',
  },
  header: {
    id: 'hw-editor-toolbar-header',
    defaultMessage: 'Header',
  },
  image: {
    id: 'hw-editor-toolbar-image',
    defaultMessage: 'Add images',
  },
  link: {
    id: 'hw-editor-toolbar-link',
    defaultMessage: 'Create link',
  },
  numbered: {
    id: 'hw-editor-toolbar-numbered',
    defaultMessage: 'Start numbered list',
  },
  strikethrough: {
    id: 'hw-editor-toolbar-strikethrough',
    defaultMessage: 'Strikethrough',
  },
});

@injectIntl
class StyleButton extends Component {
  handleMouseDown = evt => evt.preventDefault();

  handleClick = evt => {
    evt.preventDefault();

    this.props.setEditorState(
      (this.props.isBlock ? RichUtils.toggleBlockType : RichUtils.toggleInlineStyle)(
        this.props.getEditorState(),
        this.props.formatStyle
      )
    );
  };

  isActive() {
    if (!this.props.getEditorState) {
      return false;
    }

    if (!this.props.isBlock) {
      return this.props
        .getEditorState()
        .getCurrentInlineStyle()
        .has(this.props.formatStyle);
    }

    const editorState = this.props.getEditorState();
    const type = editorState
      .getCurrentContent()
      .getBlockForKey(editorState.getSelection().getStartKey())
      .getType();
    if (this.props.formatStyle.indexOf('header') === 0) {
      return type.indexOf('header') === 0;
    }
    return type === this.props.formatStyle;
  }

  render() {
    const buttonAriaLabel = this.props.intl.formatMessage(this.props.ariaLabel);

    return (
      <Button
        className={classNames(styles.button, { [styles.active]: this.isActive() })}
        disableFocusRipple
        disableRipple
        size="small"
        aria-label={buttonAriaLabel}
        onMouseDown={this.handleMouseDown}
        onClick={this.handleClick}
      >
        {this.props.children}
      </Button>
    );
  }
}

export class BoldButton extends Component {
  render() {
    return (
      <StyleButton ariaLabel={messages.bold} formatStyle="BOLD" {...this.props}>
        <FormatBoldIcon />
      </StyleButton>
    );
  }
}

export class StrikethroughButton extends Component {
  render() {
    return (
      <StyleButton ariaLabel={messages.strikethrough} formatStyle="STRIKETHROUGH" {...this.props}>
        <FormatStrikethroughIcon />
      </StyleButton>
    );
  }
}

export class LinkButton extends Component {
  render() {
    return (
      <StyleButton ariaLabel={messages.link} formatStyle="link" {...this.props}>
        <InsertLinkIcon />
      </StyleButton>
    );
  }
}

export class HeaderButton extends Component {
  render() {
    const editorState = this.props.getEditorState();
    const type =
      editorState &&
      editorState
        .getCurrentContent()
        .getBlockForKey(editorState.getSelection().getStartKey())
        .getType();
    const formatStyle = type === 'header-one' ? 'header-two' : type === 'header-two' ? 'header-two' : 'header-one';

    return (
      <StyleButton isBlock={true} ariaLabel={messages.header} formatStyle={formatStyle} {...this.props}>
        <FormatSizeIcon />
      </StyleButton>
    );
  }
}

export class BulletedListButton extends Component {
  render() {
    return (
      <StyleButton isBlock={true} ariaLabel={messages.bulleted} formatStyle="unordered-list-item" {...this.props}>
        <FormatListBulletedIcon />
      </StyleButton>
    );
  }
}

export class NumberedListButton extends Component {
  render() {
    return (
      <StyleButton isBlock={true} ariaLabel={messages.numbered} formatStyle="ordered-list-item" {...this.props}>
        <FormatListNumberedIcon />
      </StyleButton>
    );
  }
}

export class BlockquoteButton extends Component {
  render() {
    return (
      <StyleButton isBlock={true} ariaLabel={messages.bulleted} formatStyle="blockquote" {...this.props}>
        <FormatQuoteIcon />
      </StyleButton>
    );
  }
}

export class CodeBlockButton extends Component {
  render() {
    return (
      <StyleButton isBlock={true} ariaLabel={messages.code} formatStyle="code-block" {...this.props}>
        <CodeIcon />
      </StyleButton>
    );
  }
}

const IMAGE_FORM_NAME = 'insert-image-form';
const IMAGE_INPUT_NAME = 'photo[]';

@withSnackbar
@injectIntl
class ImageButtonComponent extends Component {
  handleMouseDown = evt => evt.preventDefault();

  handleClick = evt => {
    evt.preventDefault();

    document.forms[IMAGE_FORM_NAME].elements[IMAGE_INPUT_NAME].click();
  };

  handleFileChange = async (evt, files) => {
    const { editorState, isError } = await uploadFiles(this.props.onMediaUpload, this.props.getEditorState(), evt.target.files);

    document.forms[IMAGE_FORM_NAME].elements[IMAGE_INPUT_NAME].value = null;

    if (isError) {
      this.props.enqueueSnackbar(this.props.intl.formatMessage(messages.errorMedia), { variant: 'error' });
      return;
    }

    this.props.setEditorState(editorState);
  };

  render() {
    const buttonAriaLabel = this.props.intl.formatMessage(messages.image);

    return (
      <>
        <Button
          className={classNames(styles.button)}
          disableFocusRipple
          disableRipple
          size="small"
          aria-label={buttonAriaLabel}
          onMouseDown={this.handleMouseDown}
          onClick={this.handleClick}
        >
          <PhotoIcon />
        </Button>
        <form name={IMAGE_FORM_NAME} className={styles.insertImageForm}>
          <input multiple type="file" name={IMAGE_INPUT_NAME} accept="image/*" onChange={this.handleFileChange} />
        </form>
      </>
    );
  }
}
export const ImageButton = ImageButtonComponent;
