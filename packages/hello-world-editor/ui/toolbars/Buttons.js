import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import CodeIcon from '@material-ui/icons/Code';
import { defineMessages, useIntl } from 'react-intl';
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
import uploadFiles from '../../media/attachment';
import { useSnackbar } from 'notistack';
import { useStyles } from './toolbarStyles';

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

function StyleButton(props) {
  const intl = useIntl();
  const styles = useStyles();

  const handleMouseDown = evt => evt.preventDefault();

  const handleClick = evt => {
    evt.preventDefault();

    props.setEditorState(
      (props.isBlock ? RichUtils.toggleBlockType : RichUtils.toggleInlineStyle)(
        props.getEditorState(),
        props.formatStyle
      )
    );
  };

  function isActive() {
    if (!props.getEditorState) {
      return false;
    }

    if (!props.isBlock) {
      return props
        .getEditorState()
        .getCurrentInlineStyle()
        .has(props.formatStyle);
    }

    const editorState = props.getEditorState();
    const type = editorState
      .getCurrentContent()
      .getBlockForKey(editorState.getSelection().getStartKey())
      .getType();
    if (props.formatStyle.indexOf('header') === 0) {
      return type.indexOf('header') === 0;
    }
    return type === props.formatStyle;
  }

  const buttonAriaLabel = intl.formatMessage(props.ariaLabel);

  return (
    <Button
      className={classNames(styles.button, { [styles.active]: isActive() })}
      disableFocusRipple
      disableRipple
      size="small"
      aria-label={buttonAriaLabel}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {props.children}
    </Button>
  );
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

export function ImageButton(props) {
  const intl = useIntl();
  const snackbar = useSnackbar();
  const styles = useStyles();

  const handleMouseDown = evt => evt.preventDefault();

  const handleClick = evt => {
    evt.preventDefault();

    document.forms[IMAGE_FORM_NAME].elements[IMAGE_INPUT_NAME].click();
  };

  const handleFileChange = async (evt, files) => {
    const { editorState, isError } = await uploadFiles(props.onMediaUpload, props.getEditorState(), evt.target.files);

    document.forms[IMAGE_FORM_NAME].elements[IMAGE_INPUT_NAME].value = null;

    if (isError) {
      snackbar.enqueueSnackbar(intl.formatMessage(messages.errorMedia), { variant: 'error' });
      return;
    }

    props.setEditorState(editorState);
  };

  const buttonAriaLabel = intl.formatMessage(messages.image);

  return (
    <>
      <Button
        className={classNames(styles.button)}
        disableFocusRipple
        disableRipple
        size="small"
        aria-label={buttonAriaLabel}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        <PhotoIcon />
      </Button>
      <form name={IMAGE_FORM_NAME} className={styles.insertImageForm}>
        <input multiple type="file" name={IMAGE_INPUT_NAME} accept="image/*" onChange={handleFileChange} />
      </form>
    </>
  );
}
