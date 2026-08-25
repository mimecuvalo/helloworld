import { type FormEvent, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { F, defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import styles from './dashboard.module.css';

const messages = defineMessages({
  handle: { defaultMessage: 'handle (e.g. you.bsky.social)' },
  appPassword: { defaultMessage: 'app password' },
});

type AtprotoStatus = {
  did: string | null;
  handle: string | null;
  pdsUrl: string | null;
  linked: boolean;
  webDid: string | null;
  hasEnvPassword: boolean;
};

// Links a Bluesky account so published posts mirror there.
//
// An app password, not the account password: Bluesky issues these under
// Settings → App Passwords precisely so a third-party site never holds the
// real one.
export default function BlueskyLink() {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  const status = useQuery({
    queryKey: ['atproto-status'],
    queryFn: () => rpc.api.users.atproto.$get().then((r) => r.json() as Promise<AtprotoStatus>),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['atproto-status'] });

  const link = useMutation({
    mutationFn: (json: { handle: string; appPassword?: string }) =>
      rpc.api.users.atproto.$post({ json }).then(async (r) => {
        if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error || 'Could not link that account.');
        return r.json();
      }),
    onSuccess: () => {
      setError('');
      setIsOpen(false);
      invalidate();
    },
    onError: (ex: Error) => setError(ex.message),
  });

  const unlink = useMutation({
    mutationFn: () => rpc.api.users.atproto.$delete().then((r) => r.json()),
    onSuccess: () => {
      setIsOpen(false);
      invalidate();
    },
  });

  if (status.isPending || !status.data) return null;
  const { linked, handle, webDid, hasEnvPassword } = status.data;

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const form = new FormData(evt.currentTarget);
    const appPassword = String(form.get('appPassword') || '');
    link.mutate({
      handle: String(form.get('handle') || ''),
      // Blank means "use BLUESKY_APP_PASSWORD from the environment"; the server
      // rejects the request if there isn't one.
      ...(appPassword ? { appPassword } : {}),
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger className={styles.blueskyTrigger}>
        <F defaultMessage="bluesky" />
        <span className={styles.blueskyState}>{linked ? `@${handle}` : <F defaultMessage="not linked" />}</span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className={styles.dialogBackdrop} />
        <Dialog.Popup className={styles.dialogPopup}>
          <Dialog.Title className={styles.dialogTitle}>
            <F defaultMessage="bluesky" />
          </Dialog.Title>

          {linked ? (
            <>
              <Dialog.Description className={styles.dialogDescription}>
                <F
                  defaultMessage="Posts you publish are mirrored to {handle}."
                  values={{ handle: <strong className="notranslate">@{handle}</strong> }}
                />
              </Dialog.Description>
              <div className={styles.dialogActions}>
                <button type="button" onClick={() => unlink.mutate()} disabled={unlink.isPending}>
                  <F defaultMessage="unlink" />
                </button>
                <Dialog.Close type="button">
                  <F defaultMessage="done" />
                </Dialog.Close>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <Dialog.Description className={styles.dialogDescription}>
                <F defaultMessage="Create an app password in Bluesky under Settings → Privacy and Security → App Passwords. Never your account password." />
              </Dialog.Description>

              <input
                type="text"
                name="handle"
                className={`${styles.dialogInput} notranslate`}
                placeholder={intl.formatMessage(messages.handle)}
                autoComplete="off"
                autoFocus
              />
              <input
                type="password"
                name="appPassword"
                className={`${styles.dialogInput} notranslate`}
                placeholder={intl.formatMessage(messages.appPassword)}
                autoComplete="off"
              />
              {hasEnvPassword ? (
                <p className={styles.dialogHint}>
                  <F defaultMessage="Leave the password blank to use BLUESKY_APP_PASSWORD from the server environment." />
                </p>
              ) : null}
              {error ? (
                <p className={styles.dialogError} role="alert">
                  {error}
                </p>
              ) : null}

              <div className={styles.dialogActions}>
                <Dialog.Close type="button">
                  <F defaultMessage="cancel" />
                </Dialog.Close>
                <button type="submit" disabled={link.isPending}>
                  {link.isPending ? <F defaultMessage="linking…" /> : <F defaultMessage="link" />}
                </button>
              </div>
            </form>
          )}

          {webDid ? (
            <p className={styles.dialogHint} title="your AT Protocol identity">
              <span className="notranslate">{webDid}</span>
            </p>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
