import { Alert, Skeleton, Snackbar } from '@mui/material';
import { ClipboardEvent, Suspense, lazy, useState } from 'react';

import { styled } from '@mui/material/styles';
import uploadFileToS3 from 'util/s3';

const HelloWorldEditor = lazy(() => import('hello-world-editor'));

const EditorStyling = styled('div', { label: 'EditorStyling' })`
  width: 100%;
  font-family: ${(props) => props.theme.typography.fontFamily};

  & > div {
    width: 100%;
    min-height: 33vh;
    border: 1px solid ${(props) => props.theme.palette.primary.light};
    box-shadow:
      1px 1px ${(props) => props.theme.palette.primary.light},
      2px 2px ${(props) => props.theme.palette.primary.light},
      3px 3px ${(props) => props.theme.palette.primary.light};
    padding: ${(props) => props.theme.spacing(2, 2, 2, 3.5)};
    margin-bottom: ${(props) => props.theme.spacing(3.5)};
    background-color: ${(props) => props.theme.palette.background.default};
  }

  & > div > div {
    background-color: ${(props) => props.theme.palette.background.default};
    color: ${(props) => props.theme.palette.text.primary};
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
`;

type EditorProps = {
  defaultValue: string;
  name: string;
  section: string;
  album: string;
  onBlur: () => void;
  onChange: (name: string, value: string) => void;
  onMediaAdd: (url: string) => void;
  onPaste: (text: string) => void;
};

export default function Editor({ name, section, album, onBlur, onChange, onMediaAdd, onPaste, ...props }: EditorProps) {
  const [hasFocused, setHasFocused] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleToastClose = () => {
    setToastMsg('');
  };

  const handleChange = (getValue: () => string) => {
    try {
      let value = getValue();

      // XXX(mime): an empty editor sets to `\\\n`, ugh
      // see: https://github.com/outline/outline/issues/1308
      if (value === '\\\n') {
        value = '';
      }

      onChange(name, value);
    } catch {
      // XXX(mime): initial load causes an exception. weird.
      // investigate further later.
    }
  };

  const handleUploadImage = async (file: File) => {
    try {
      const url = await uploadFileToS3(file, file.name, section, album);
      onMediaAdd(url);
      return url;
    } catch {
      setToastMsg('Failed to upload image.');
    }
  };

  const handleFocus = () => {
    setHasFocused(true);
  };
  const handleBlur = () => {
    if (hasFocused) {
      // TODO(mime): I'm not sure why but onBlur is fired on init for the editor.
      // So we only fire the 'true' blur event once we've seen a focus event.
      onBlur();
    }
  };

  const handlePaste = (view: any, event: ClipboardEvent) => {
    if (!view.shiftKey) {
      onPaste(event.clipboardData.getData('text/plain'));
    }
    return true;
  };

  return (
    <>
      <Suspense
        fallback={
          <div style={{ width: '100%' }}>
            <Skeleton
              variant="circular"
              width={64}
              height={64}
              sx={{ float: 'right', marginLeft: 4, marginRight: 4 }}
            />
            <Skeleton width="70%" />
            <Skeleton width="70%" />
            <Skeleton width="70%" />
          </div>
        }
      >
        <EditorStyling>
          <HelloWorldEditor
            // @ts-ignore not sure how to fix this.
            uploadImage={handleUploadImage}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onChange={handleChange}
            handleDOMEvents={{
              paste: (view: any, event: Event) => handlePaste(view, event as unknown as ClipboardEvent),
            }}
            {...props}
            className="notranslate"
          />
        </EditorStyling>
      </Suspense>

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
