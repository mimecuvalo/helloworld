import { type FormEvent, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { F, defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import styles from './dashboard.module.css';

const messages = defineMessages({
  profile: { defaultMessage: 'https://mastodon.social/@you' },
});

type MastodonStatus = {
  mastodonUrl: string | null;
  profileUrl: string | null;
  fediverseHandle: string | null;
};

// There is no Mastodon account to "link" the way Bluesky is linked — this site
// speaks ActivityPub itself, so a Mastodon user follows it directly by its
// handle. What this panel does is the rel="me" handshake, which is what makes
// the link on your Mastodon profile turn green.
export default function MastodonLink() {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  const status = useQuery({
    queryKey: ['mastodon-status'],
    queryFn: () => rpc.api.users.mastodon.$get().then((r) => r.json() as Promise<MastodonStatus>),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['mastodon-status'] });

  const link = useMutation({
    mutationFn: (json: { mastodonUrl: string }) =>
      rpc.api.users.mastodon.$post({ json }).then(async (r) => {
        if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error || 'Could not save that URL.');
        return r.json();
      }),
    onSuccess: () => {
      setError('');
      invalidate();
    },
    onError: (ex: Error) => setError(ex.message),
  });

  const unlink = useMutation({
    mutationFn: () => rpc.api.users.mastodon.$delete().then((r) => r.json()),
    onSuccess: invalidate,
  });

  if (status.isPending || !status.data) return null;
  const { mastodonUrl, profileUrl, fediverseHandle } = status.data;

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const form = new FormData(evt.currentTarget);
    link.mutate({ mastodonUrl: String(form.get('mastodonUrl') || '') });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger className={styles.mastodonTrigger}>
        <F defaultMessage="mastodon" />
        <span className={styles.mastodonState}>
          {mastodonUrl ? new URL(mastodonUrl).host : <F defaultMessage="not linked" />}
        </span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className={styles.dialogBackdrop} />
        <Dialog.Popup className={styles.dialogPopup}>
          <Dialog.Title className={styles.dialogTitle}>
            <F defaultMessage="mastodon" />
          </Dialog.Title>

          <Dialog.Description className={styles.dialogDescription}>
            <F defaultMessage="This site is its own fediverse server, so there is no account to connect — people follow it directly at:" />
          </Dialog.Description>
          <code className={`${styles.dialogCode} notranslate`}>{fediverseHandle}</code>

          <Dialog.Description className={styles.dialogDescription}>
            <F defaultMessage="Optionally, verify it on your Mastodon profile. Add your site to a profile metadata field there, then paste your profile URL here so this site links back." />
          </Dialog.Description>
          <code className={`${styles.dialogCode} notranslate`}>{profileUrl}</code>

          <form onSubmit={handleSubmit}>
            <input
              type="url"
              name="mastodonUrl"
              className={`${styles.dialogInput} notranslate`}
              placeholder={intl.formatMessage(messages.profile)}
              defaultValue={mastodonUrl || ''}
              autoComplete="off"
              autoFocus
            />
            {error ? (
              <p className={styles.dialogError} role="alert">
                {error}
              </p>
            ) : null}

            <div className={styles.dialogActions}>
              {mastodonUrl ? (
                <button type="button" onClick={() => unlink.mutate()} disabled={unlink.isPending}>
                  <F defaultMessage="remove" />
                </button>
              ) : null}
              <Dialog.Close type="button">
                <F defaultMessage="cancel" />
              </Dialog.Close>
              <button type="submit" disabled={link.isPending}>
                <F defaultMessage="save" />
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
