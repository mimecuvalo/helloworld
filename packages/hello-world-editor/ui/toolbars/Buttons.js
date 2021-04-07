import { defineMessages, useIntl } from 'react-intl';

import Button from '@material-ui/core/Button';
import CodeIcon from '@material-ui/icons/Code';
import FormatBoldIcon from '@material-ui/icons/FormatBold';
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
import FormatListNumberedIcon from '@material-ui/icons/FormatListNumbered';
import FormatQuoteIcon from '@material-ui/icons/FormatQuote';
import FormatSizeIcon from '@material-ui/icons/FormatSize';
import FormatStrikethroughIcon from '@material-ui/icons/FormatStrikethrough';
import InsertLinkIcon from '@material-ui/icons/InsertLink';
import PhotoIcon from '@material-ui/icons/Photo';
import { RichUtils } from 'draft-js';
import classNames from 'classnames';
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

  const handleMouseDown = (evt) => evt.preventDefault();

  const handleClick = (evt) => {
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
      return props.getEditorState().getCurrentInlineStyle().has(props.formatStyle);
    }

    const editorState = props.getEditorState();
    const type = editorState.getCurrentContent().getBlockForKey(editorState.getSelection().getStartKey()).getType();
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

export function BoldButton(props) {
  return (
    <StyleButton ariaLabel={messages.bold} formatStyle="BOLD" {...props}>
      <FormatBoldIcon />
    </StyleButton>
  );
}

export function StrikethroughButton(props) {
  return (
    <StyleButton ariaLabel={messages.strikethrough} formatStyle="STRIKETHROUGH" {...props}>
      <FormatStrikethroughIcon />
    </StyleButton>
  );
}

export function LinkButton(props) {
  return (
    <StyleButton ariaLabel={messages.link} formatStyle="link" {...props}>
      <InsertLinkIcon />
    </StyleButton>
  );
}

export function HeaderButton(props) {
  const editorState = props.getEditorState();
  const type =
    editorState && editorState.getCurrentContent().getBlockForKey(editorState.getSelection().getStartKey()).getType();
  const formatStyle = type === 'header-one' ? 'header-two' : type === 'header-two' ? 'header-two' : 'header-one';

  return (
    <StyleButton isBlock={true} ariaLabel={messages.header} formatStyle={formatStyle} {...props}>
      <FormatSizeIcon />
    </StyleButton>
  );
}

export function BulletedListButton(props) {
  return (
    <StyleButton isBlock={true} ariaLabel={messages.bulleted} formatStyle="unordered-list-item" {...props}>
      <FormatListBulletedIcon />
    </StyleButton>
  );
}

export function NumberedListButton(props) {
  return (
    <StyleButton isBlock={true} ariaLabel={messages.numbered} formatStyle="ordered-list-item" {...props}>
      <FormatListNumberedIcon />
    </StyleButton>
  );
}

export function BlockquoteButton(props) {
  return (
    <StyleButton isBlock={true} ariaLabel={messages.bulleted} formatStyle="blockquote" {...props}>
      <FormatQuoteIcon />
    </StyleButton>
  );
}

export function CodeBlockButton(props) {
  return (
    <StyleButton isBlock={true} ariaLabel={messages.code} formatStyle="code-block" {...props}>
      <CodeIcon />
    </StyleButton>
  );
}

const IMAGE_FORM_NAME = 'insert-image-form';
const IMAGE_INPUT_NAME = 'photo[]';

export function ImageButton(props) {
  const intl = useIntl();
  const snackbar = useSnackbar();
  const styles = useStyles();

  const handleMouseDown = (evt) => evt.preventDefault();

  const handleClick = (evt) => {
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
