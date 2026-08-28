import { useEffect, useRef, useState } from 'react';
import { F } from 'i18n';
import styles from './editor.module.css';

// Asks for one name. Kept as a plain overlay rather than <dialog>, because the
// editor lives inside the author's own themed page and showModal() would put it
// in the top layer, outside every --hw-* variable the theme sets.
export default function NameDialog({
  error,
  heading,
  isPending,
  label,
  onCancel,
  onSubmit,
  placeholder,
}: {
  error?: string | null;
  heading: React.ReactNode;
  isPending?: boolean;
  label: React.ReactNode;
  onCancel: () => void;
  onSubmit: (name: string) => void;
  placeholder?: string;
}) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div className={styles.dialogBackdrop} onClick={(evt) => evt.target === evt.currentTarget && onCancel()}>
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={placeholder}
        onSubmit={(evt) => {
          evt.preventDefault();
          if (name.trim()) onSubmit(name.trim());
        }}
      >
        <h2 className={styles.dialogHeading}>{heading}</h2>
        <label className={styles.optionRow}>
          <span className={styles.optionLabel}>{label}</span>
          <input
            ref={inputRef}
            type="text"
            className={`${styles.optionInput} notranslate`}
            placeholder={placeholder}
            value={name}
            onChange={(evt) => setName(evt.target.value)}
          />
        </label>
        {error ? (
          <p className={styles.dialogError} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.dialogActions}>
          <button type="button" className="btn" onClick={onCancel}>
            <F defaultMessage="cancel" />
          </button>
          <button type="submit" className="btn" disabled={isPending || !name.trim()}>
            <F defaultMessage="create" />
          </button>
        </div>
      </form>
    </div>
  );
}
