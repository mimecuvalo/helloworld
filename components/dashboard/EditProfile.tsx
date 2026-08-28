import { type FormEvent, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { F, defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import styles from './dashboard.module.css';

const messages = defineMessages({
  name: { defaultMessage: 'your name' },
  title: { defaultMessage: 'the name of this site' },
  description: { defaultMessage: 'a sentence about the site' },
  favicon: { defaultMessage: 'https://…/favicon.png' },
  logo: { defaultMessage: 'https://…/logo.png' },
  license: { defaultMessage: 'e.g. CC BY-SA 4.0' },
});

type Profile = {
  username: string;
  name: string;
  title: string;
  description: string | null;
  favicon: string | null;
  logo: string | null;
  license: string | null;
  theme: string;
  themes: string[];
};

// The one place to change what the site says it is. Everything here is public —
// keys, hostname routing and the linked accounts each have their own flow, and
// none of them belong in a form you fill in casually.
export default function EditProfile({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: () => rpc.api.users.profile.$get().then((r) => r.json() as Promise<Profile>),
    // Only worth fetching once the dialog is actually opened.
    enabled: open,
  });

  const save = useMutation({
    mutationFn: (json: Omit<Profile, 'username' | 'themes'>) =>
      rpc.api.users.profile.$post({ json }).then(async (r) => {
        if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error || 'Could not save that.');
        return r.json();
      }),
    onSuccess: () => {
      setError('');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // The theme, title and logo are all rendered from the route loader, so the
      // page has to re-load to show them rather than just re-render.
      window.location.reload();
    },
    onError: (ex: Error) => setError(ex.message),
  });

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const form = new FormData(evt.currentTarget);
    const field = (key: string) => String(form.get(key) || '');
    save.mutate({
      name: field('name'),
      title: field('title'),
      description: field('description'),
      favicon: field('favicon'),
      logo: field('logo'),
      license: field('license'),
      theme: field('theme'),
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.dialogBackdrop} />
        <Dialog.Popup className={styles.dialogPopup}>
          <Dialog.Title className={styles.dialogTitle}>
            <F defaultMessage="edit profile" />
          </Dialog.Title>

          {profile.isPending || !profile.data ? (
            <Dialog.Description className={styles.dialogDescription}>
              <F defaultMessage="loading…" />
            </Dialog.Description>
          ) : (
            <form onSubmit={handleSubmit}>
              <Field label={<F defaultMessage="name" />}>
                <input
                  type="text"
                  name="name"
                  className={styles.dialogInput}
                  placeholder={intl.formatMessage(messages.name)}
                  defaultValue={profile.data.name}
                  required
                  autoFocus
                />
              </Field>

              <Field label={<F defaultMessage="site title" />}>
                <input
                  type="text"
                  name="title"
                  className={styles.dialogInput}
                  placeholder={intl.formatMessage(messages.title)}
                  defaultValue={profile.data.title}
                />
              </Field>

              <Field label={<F defaultMessage="description" />}>
                <textarea
                  name="description"
                  rows={3}
                  className={styles.dialogInput}
                  placeholder={intl.formatMessage(messages.description)}
                  defaultValue={profile.data.description || ''}
                />
              </Field>

              <Field label={<F defaultMessage="avatar / favicon" />}>
                <input
                  type="text"
                  name="favicon"
                  className={`${styles.dialogInput} notranslate`}
                  placeholder={intl.formatMessage(messages.favicon)}
                  defaultValue={profile.data.favicon || ''}
                  autoComplete="off"
                />
              </Field>

              <Field label={<F defaultMessage="logo" />}>
                <input
                  type="text"
                  name="logo"
                  className={`${styles.dialogInput} notranslate`}
                  placeholder={intl.formatMessage(messages.logo)}
                  defaultValue={profile.data.logo || ''}
                  autoComplete="off"
                />
              </Field>

              <Field label={<F defaultMessage="license" />}>
                <input
                  type="text"
                  name="license"
                  className={styles.dialogInput}
                  placeholder={intl.formatMessage(messages.license)}
                  defaultValue={profile.data.license || ''}
                />
              </Field>

              <Field label={<F defaultMessage="theme" />}>
                <select name="theme" className={`${styles.dialogInput} notranslate`} defaultValue={profile.data.theme}>
                  {profile.data.themes.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </Field>

              {error ? (
                <p className={styles.dialogError} role="alert">
                  {error}
                </p>
              ) : null}

              <div className={styles.dialogActions}>
                <Dialog.Close type="button" className={styles.dialogButton}>
                  <F defaultMessage="cancel" />
                </Dialog.Close>
                <button type="submit" className={styles.dialogButton} disabled={save.isPending}>
                  <F defaultMessage="save" />
                </button>
              </div>
            </form>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className={styles.dialogField}>
      <span className={styles.dialogLabel}>{label}</span>
      {children}
    </label>
  );
}
