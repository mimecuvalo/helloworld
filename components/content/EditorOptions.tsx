import { useRef, useState } from 'react';
import { F, defineMessages, useIntl } from 'i18n';
import uploadFileToS3 from 'lib/s3-upload';
import { thumbUrl } from 'lib/url-factory';
import { CONTENT_TEMPLATES } from 'util/constants';
import styles from '../editor/editor.module.css';

export type ContentOptions = {
  title: string;
  name: string;
  section: string;
  album: string;
  template: string;
  thumb: string;
  hidden: boolean;
};

const messages = defineMessages({
  name: { defaultMessage: 'name' },
  none: { defaultMessage: '-none-' },
  thumb: { defaultMessage: 'thumbnail url' },
  title: { defaultMessage: 'title' },
});

export default function EditorOptions({
  isAlbum,
  isDeleting,
  isSection,
  onChange,
  onDelete,
  values,
}: {
  isAlbum: boolean;
  isDeleting?: boolean;
  isSection: boolean;
  onChange: (patch: Partial<ContentOptions>) => void;
  onDelete?: () => void;
  values: ContentOptions;
}) {
  const intl = useIntl();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Deleting a page is one click away from unrecoverable, so make it two.
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleThumbUpload = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    try {
      onChange({ thumb: await uploadFileToS3(file, file.name, values.section, values.album) });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.options}>
      <label className={styles.optionRow}>
        <span className={styles.optionLabel}>
          <F defaultMessage="title" />
        </span>
        <input
          type="text"
          className={`${styles.optionInput} notranslate`}
          placeholder={intl.formatMessage(messages.title)}
          value={values.title}
          onChange={(evt) => onChange({ title: evt.target.value })}
        />
      </label>

      <label className={styles.optionRow}>
        <span className={styles.optionLabel}>
          <F defaultMessage="name" />
        </span>
        <input
          type="text"
          className={`${styles.optionInput} notranslate`}
          placeholder={intl.formatMessage(messages.name)}
          value={values.name}
          onChange={(evt) => onChange({ name: evt.target.value })}
        />
      </label>

      {isSection ? (
        <p className={styles.optionHint}>
          <F defaultMessage="This is a top-level section, so it stays where it is. Renaming it moves everything inside it along with it." />
        </p>
      ) : null}
      {isAlbum ? (
        <p className={styles.optionHint}>
          <F defaultMessage="Everything inside this album moves with it, wherever the section picker up top sends it. Sending it to main turns it into a section of its own." />
        </p>
      ) : null}

      <label className={styles.optionRow}>
        <span className={styles.optionLabel}>
          <F defaultMessage="template" />
        </span>
        <select
          className={`${styles.optionInput} notranslate`}
          value={values.template}
          onChange={(evt) => onChange({ template: evt.target.value })}
        >
          {CONTENT_TEMPLATES.map((template) => (
            <option key={template || 'none'} value={template}>
              {template || intl.formatMessage(messages.none)}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.optionRow}>
        <span className={styles.optionLabel}>
          <F defaultMessage="thumb" />
        </span>
        <input
          type="text"
          className={`${styles.optionInput} notranslate`}
          placeholder={intl.formatMessage(messages.thumb)}
          value={values.thumb}
          onChange={(evt) => onChange({ thumb: evt.target.value })}
        />
        <button type="button" className="btn" disabled={isUploading} onClick={() => fileRef.current?.click()}>
          {isUploading ? <F defaultMessage="uploading…" /> : <F defaultMessage="select image" />}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(evt) => handleThumbUpload(evt.target.files?.[0])}
        />
      </div>
      {values.thumb ? <img className={styles.optionThumb} src={thumbUrl(values.thumb)} alt="" /> : null}

      <label className={styles.optionRow}>
        <span className={styles.optionLabel}>
          <F defaultMessage="hidden" />
        </span>
        <input type="checkbox" checked={values.hidden} onChange={(evt) => onChange({ hidden: evt.target.checked })} />
      </label>
      {isSection || isAlbum ? (
        <p className={styles.optionHint}>
          <F defaultMessage="Hiding this hides everything inside it too." />
        </p>
      ) : null}

      {onDelete ? (
        <div className={styles.optionActions}>
          <button
            type="button"
            className={`btn ${styles.deleteButton}`}
            disabled={isDeleting}
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            onBlur={() => setConfirmDelete(false)}
          >
            {confirmDelete ? <F defaultMessage="ya sure there, buddy?" /> : <F defaultMessage="delete" />}
          </button>
          {(isSection || isAlbum) && confirmDelete ? (
            <span className={styles.optionHint}>
              <F defaultMessage="Deleting this leaves whatever is inside it stranded." />
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
