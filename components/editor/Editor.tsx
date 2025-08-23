import { Alert, Skeleton, Snackbar } from '@mui/material';
import { useState, useCallback, useEffect } from 'react';
import { useEditor as useTipTapEditor, EditorContent, Editor as TipTapEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions';

import { styled } from '@mui/material/styles';
import uploadFileToS3 from 'util/s3';
import { EditorView } from '@tiptap/pm/view';
import Iframe from './IframeExtension';
import { useEditor } from 'application/EditorContext';
import EditorToolbar from './Toolbar';

const EditorStyling = styled('div', { label: 'EditorStyling' })`
  width: 100%;
  font-family: ${(props) => props.theme.typography.fontFamily};

  .tiptap {
    width: 100%;
    padding: ${(props) => props.theme.spacing(0, 1)};
    background-color: ${(props) => props.theme.palette.background.default};
    color: ${(props) => props.theme.palette.text.primary};
    outline: none;

    &:focus {
      outline: none;
    }
  }

  p {
    margin-block: 0;
  }

  h1 {
    font-family: ${(props) => props.theme.typography.h1.fontFamily};
    font-weight: ${(props) => props.theme.typography.h1.fontWeight};
    font-size: ${(props) => props.theme.typography.h1.fontSize};
    line-height: ${(props) => props.theme.typography.h1.lineHeight};
    margin-top: ${(props) => props.theme.spacing(1)};
    margin-bottom: ${(props) => props.theme.spacing(1)};
    color: ${(props) => props.theme.palette.text.primary};
  }

  h2 {
    font-family: ${(props) => props.theme.typography.h2.fontFamily};
    font-weight: ${(props) => props.theme.typography.h2.fontWeight};
    font-size: ${(props) => props.theme.typography.h2.fontSize};
    line-height: ${(props) => props.theme.typography.h2.lineHeight};
    margin-top: ${(props) => props.theme.spacing(1)};
    margin-bottom: ${(props) => props.theme.spacing(1)};
    color: ${(props) => props.theme.palette.text.primary};
  }

  h3 {
    font-family: ${(props) => props.theme.typography.h3.fontFamily};
    font-weight: ${(props) => props.theme.typography.h3.fontWeight};
    font-size: ${(props) => props.theme.typography.h3.fontSize};
    line-height: ${(props) => props.theme.typography.h3.lineHeight};
    margin-top: ${(props) => props.theme.spacing(1)};
    margin-bottom: ${(props) => props.theme.spacing(1)};
    color: ${(props) => props.theme.palette.text.primary};
  }

  h4 {
    font-family: ${(props) => props.theme.typography.h4.fontFamily};
    font-weight: ${(props) => props.theme.typography.h4.fontWeight};
    font-size: ${(props) => props.theme.typography.h4.fontSize};
    line-height: ${(props) => props.theme.typography.h4.lineHeight};
    margin-top: ${(props) => props.theme.spacing(1)};
    margin-bottom: ${(props) => props.theme.spacing(1)};
    color: ${(props) => props.theme.palette.text.primary};
  }

  img {
    max-width: 100%;
    height: auto;
  }

  iframe {
    width: 50%;
    aspect-ratio: 16 / 9;
  }
`;

type EditorProps = {
  defaultValue?: string;
  name: string;
  section: string;
  album: string;
  onBlur?: () => void;
  onChange: (name: string, value: string) => void;
  onMediaAdd?: (url: string) => void;
  onPaste?: (text: string) => void;
  placeholder?: string;
};

export default function Editor({
  name,
  section,
  album,
  onBlur,
  onChange,
  onMediaAdd,
  onPaste,
  placeholder,
  defaultValue,
}: EditorProps) {
  const { setEditor } = useEditor();
  const [hasFocused, setHasFocused] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleToastClose = useCallback(() => {
    setToastMsg('');
  }, []);

  const handleUploadImage = useCallback(
    async (file: File) => {
      try {
        const url = await uploadFileToS3(file, file.name, section, album);
        onMediaAdd?.(url);
        return url;
      } catch {
        setToastMsg('Failed to upload image.');
      }
    },
    [section, album, onMediaAdd]
  );

  const handleChange = useCallback(
    (editor: TipTapEditor) => {
      const content = editor.getHTML();
      onChange(name, content);
    },
    [name, onChange]
  );

  const handleFocus = useCallback(() => {
    setHasFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    if (hasFocused) {
      onBlur?.();
    }
  }, [hasFocused, onBlur]);

  const editor = useTipTapEditor(
    {
      extensions: [
        StarterKit,
        Image.configure({
          HTMLAttributes: {
            class: 'editor-image',
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        Iframe,
      ],
      content: defaultValue || '',
      onUpdate: ({ editor }: { editor: TipTapEditor }) => {
        handleChange(editor);
      },
      onFocus: handleFocus,
      autofocus: true,
      onBlur: handleBlur,
      editorProps: {
        handlePaste: (view: EditorView, event: ClipboardEvent) => {
          const items = Array.from(event.clipboardData?.items || []);
          const imageItem = items.find((item: any) => item.type.indexOf('image') === 0);
          if (imageItem) {
            const file = (imageItem as DataTransferItem).getAsFile();
            if (file instanceof File) {
              handleUploadImage(file).then((url) => {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.insert(view.state.selection.anchor, node);
                return view.dispatch(transaction);
              });
              return true;
            }
          }

          // Handle text paste
          const text = event.clipboardData?.getData('text/plain');
          if (text) {
            onPaste?.(text);
          }

          return false; // Let TipTap handle the paste
        },
        handleDrop: (view: EditorView, event: DragEvent) => {
          const files = Array.from(event.dataTransfer?.files || []);
          const imageFile = files.find((file) => file.type.indexOf('image') === 0);

          if (imageFile instanceof File) {
            handleUploadImage(imageFile).then((url) => {
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (!coordinates) return;
              const node = schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.insert(coordinates.pos, node);
              return view.dispatch(transaction);
            });
            return true;
          }

          return false;
        },
      },
      immediatelyRender: false,
    },
    [placeholder, handleChange, handleFocus, handleBlur, handleUploadImage, onPaste]
  );

  useEffect(() => {
    setEditor(editor);
  }, [editor, setEditor]);

  // Update editor content when defaultValue changes
  useEffect(() => {
    if (editor && defaultValue !== undefined && editor.getHTML() !== defaultValue) {
      editor.commands.setContent(defaultValue, { emitUpdate: false });
    }
  }, [editor, defaultValue]);

  if (!editor) {
    return (
      <div style={{ width: '100%' }}>
        <Skeleton variant="circular" width={64} height={64} sx={{ float: 'right', marginLeft: 4, marginRight: 4 }} />
        <Skeleton width="70%" />
        <Skeleton width="70%" />
        <Skeleton width="70%" />
      </div>
    );
  }

  return (
    <>
      <EditorStyling>
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} className="notranslate" />
      </EditorStyling>

      <Snackbar open={!!toastMsg} autoHideDuration={3000} onClose={handleToastClose}>
        <Alert
          className="notranslate"
          elevation={6}
          variant="filled"
          onClose={handleToastClose}
          severity="error"
          sx={{ width: '100%' }}
        >
          {toastMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
