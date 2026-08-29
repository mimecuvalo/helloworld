import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { useEditorState, type Editor } from '@tiptap/react';
import { PluginKey, TextSelection } from '@tiptap/pm/state';
import {
  CheckIcon,
  CodeIcon,
  ExternalLinkIcon,
  FontBoldIcon,
  HeadingIcon,
  Link1Icon,
  ListBulletIcon,
  StrikethroughIcon,
  TextIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import styles from './editor.module.css';

// Tiptap drops hrefs it can't parse as a URL, so fill in what people leave off:
// a bare domain means https, a bare email address means mailto.
function normalizeUrl(value: string) {
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(value) || /^(mailto|tel):/i.test(value) || /^[/#]/.test(value)) {
    return value;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return `mailto:${value}`;
  }
  return `https://${value}`;
}

function prettyUrl(href: string) {
  return href.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export default function EditorToolbar({
  editor,
  disableHeadings,
}: {
  editor: Editor | null;
  disableHeadings?: boolean;
}) {
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [caption, setCaption] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);
  const captionInputRef = useRef<HTMLInputElement>(null);
  // Named so the blur handler below can tell the menu to hide itself.
  const [bubbleMenuKey] = useState(() => new PluginKey('editorToolbar'));

  // `useEditor` doesn't re-render on transactions, so read everything the
  // buttons reflect through a subscription instead of off `editor` directly.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      // Tiptap tears the view and schema down before React unmounts us, and
      // reading either one afterwards throws.
      if (!editor || editor.isDestroyed) return null;
      return {
        isBold: editor.isActive('bold'),
        isStrike: editor.isActive('strike'),
        isHeading: editor.isActive('heading', { level: 1 }),
        isCode: editor.isActive('code'),
        isBulletList: editor.isActive('bulletList'),
        isLink: editor.isActive('link'),
        href: (editor.getAttributes('link').href as string | undefined) || '',
        hasSelection: !editor.state.selection.empty,
        supportsLinks: !!editor.schema.marks.link,
        isImage: !!editor.schema.nodes.image && editor.isActive('image'),
        hasCaption: !!(editor.getAttributes('image').caption as string | undefined),
      };
    },
  });

  // Moving the caret means the link under it (if any) changed: start over.
  useEffect(() => {
    if (!editor) return;
    const closeEditors = () => {
      setIsEditingLink(false);
      setIsEditingCaption(false);
    };
    editor.on('selectionUpdate', closeEditors);
    return () => {
      editor.off('selectionUpdate', closeEditors);
    };
  }, [editor]);

  // Layout effect, not effect: the blur handler below checks where focus landed
  // once the click settles, and the input has to own it by then.
  useLayoutEffect(() => {
    if (!isEditingLink) return;
    linkInputRef.current?.focus();
    linkInputRef.current?.select();
  }, [isEditingLink]);

  useLayoutEffect(() => {
    if (!isEditingCaption) return;
    captionInputRef.current?.focus();
    captionInputRef.current?.select();
  }, [isEditingCaption]);

  if (!editor || !state) return null;

  const btn = (active: boolean) => (active ? styles.isActive : undefined);

  const { supportsLinks, isLink: isLinkActive, href: activeHref } = state;

  const openLinkEditor = () => {
    setLinkUrl((editor.getAttributes('link').href as string | undefined) || '');
    setIsEditingLink(true);
  };

  const applyLink = () => {
    const href = linkUrl.trim();
    const chain = editor.chain().focus().extendMarkRange('link');
    if (href) {
      chain.setLink({ href: normalizeUrl(href) }).run();
    } else {
      chain.unsetLink().run();
    }
    setIsEditingLink(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setIsEditingLink(false);
  };

  const handleLinkKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      applyLink();
    } else if (evt.key === 'Escape') {
      evt.preventDefault();
      setIsEditingLink(false);
      editor.commands.focus();
    }
  };

  const openCaptionEditor = () => {
    setCaption((editor.getAttributes('image').caption as string | undefined) || '');
    setIsEditingCaption(true);
  };

  const applyCaption = () => {
    editor
      .chain()
      .focus()
      .updateAttributes('image', { caption: caption.trim() || null })
      .run();
    setIsEditingCaption(false);
  };

  const deleteImage = () => {
    editor.chain().focus().deleteSelection().run();
    setIsEditingCaption(false);
  };

  const handleCaptionKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      applyCaption();
    } else if (evt.key === 'Escape') {
      evt.preventDefault();
      setIsEditingCaption(false);
      editor.commands.focus();
    }
  };

  const handleMenuBlur = (evt: FocusEvent<HTMLDivElement>) => {
    const menu = evt.currentTarget;
    // Swapping the toolbar out for the link editor unmounts the button that was
    // just clicked, dropping focus to <body> — so don't trust `relatedTarget`,
    // let focus settle and then see where it actually landed.
    setTimeout(() => {
      if (editor.isDestroyed || menu.contains(document.activeElement)) return;
      setIsEditingLink(false);
      setIsEditingCaption(false);
      // The editor's own blur was swallowed when focus first moved into the
      // menu, so nothing else is going to dismiss it. Ask it directly: a bare
      // transaction won't do, since the plugin skips updates that change
      // neither the doc nor the selection.
      editor.view.dispatch(editor.state.tr.setMeta(bubbleMenuKey, 'hide'));
    }, 0);
  };

  // The link editor takes the toolbar's place rather than stacking below it: a
  // caret parked in a link has nothing to format anyway.
  const showLinkPanel = supportsLinks && isLinkActive && !state.hasSelection && !isEditingLink;

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={bubbleMenuKey}
      className={styles.bubbleMenu}
      onBlur={handleMenuBlur}
      shouldShow={({ editor, element, view, state, from, to }) => {
        if (!editor.isEditable) return false;
        // `view` rather than `editor.view`: this runs off a debounce timer that
        // can outlive the editor, and `editor.view` throws once it's torn down.
        if (!view.hasFocus() && !element.contains(document.activeElement)) return false;
        // A caret sitting inside a link has nothing selected, but still needs
        // the link panel.
        if (editor.isActive('link')) return true;
        const { selection } = state;
        if (selection.empty) return false;
        return !!state.doc.textBetween(from, to).length || !(selection instanceof TextSelection);
      }}
    >
      {state.isImage ? (
        isEditingCaption ? (
          <>
            <input
              ref={captionInputRef}
              type="text"
              aria-label="image caption"
              placeholder="caption"
              className={styles.menuInput}
              value={caption}
              onChange={(evt) => setCaption(evt.target.value)}
              onKeyDown={handleCaptionKeyDown}
            />
            <button type="button" aria-label="apply caption" onClick={applyCaption}>
              <CheckIcon width={18} height={18} aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <button type="button" aria-label="caption" onClick={openCaptionEditor} className={btn(state.hasCaption)}>
              <TextIcon width={18} height={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="delete image" onClick={deleteImage}>
              <TrashIcon width={18} height={18} aria-hidden="true" />
            </button>
          </>
        )
      ) : isEditingLink ? (
        <>
          <input
            ref={linkInputRef}
            type="url"
            aria-label="link url"
            placeholder="example.com"
            className={styles.menuInput}
            value={linkUrl}
            onChange={(evt) => setLinkUrl(evt.target.value)}
            onKeyDown={handleLinkKeyDown}
          />
          <button type="button" aria-label="apply link" onClick={applyLink}>
            <CheckIcon width={18} height={18} aria-hidden="true" />
          </button>
          {isLinkActive ? (
            <button type="button" aria-label="remove link" onClick={removeLink}>
              <TrashIcon width={18} height={18} aria-hidden="true" />
            </button>
          ) : null}
        </>
      ) : showLinkPanel ? (
        <>
          <button type="button" className={styles.linkHref} onClick={openLinkEditor} title={activeHref}>
            {prettyUrl(activeHref)}
          </button>
          <a href={activeHref} target="_blank" rel="noopener noreferrer" aria-label="open link">
            <ExternalLinkIcon width={18} height={18} aria-hidden="true" />
          </a>
          <button type="button" aria-label="remove link" onClick={removeLink}>
            <TrashIcon width={18} height={18} aria-hidden="true" />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            aria-label="bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={btn(state.isBold)}
          >
            <FontBoldIcon width={18} height={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="strikethrough"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={btn(state.isStrike)}
          >
            <StrikethroughIcon width={18} height={18} aria-hidden="true" />
          </button>
          {!disableHeadings ? (
            <button
              type="button"
              aria-label="heading"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={btn(state.isHeading)}
            >
              <HeadingIcon width={18} height={18} aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="inline code"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={btn(state.isCode)}
          >
            <CodeIcon width={18} height={18} aria-hidden="true" />
          </button>
          {supportsLinks ? (
            <button type="button" aria-label="link" onClick={openLinkEditor} className={btn(isLinkActive)}>
              <Link1Icon width={18} height={18} aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="bullet list"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={btn(state.isBulletList)}
          >
            <ListBulletIcon width={18} height={18} aria-hidden="true" />
          </button>
        </>
      )}
    </BubbleMenu>
  );
}
