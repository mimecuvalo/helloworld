import { type FormEvent, useState } from 'react';
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
};

// Links a Bluesky account so published posts mirror there.
//
// An app password, not the account password: Bluesky issues these under
// Settings → App Passwords precisely so a third-party site never holds the
// real one.
export default function BlueskyLink() {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const status = useQuery({
    queryKey: ['atproto-status'],
    queryFn: () => rpc.api.users.atproto.$get().then((r) => r.json() as Promise<AtprotoStatus>),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['atproto-status'] });

  const link = useMutation({
    mutationFn: (json: { handle: string; appPassword: string }) =>
      rpc.api.users.atproto.$post({ json }).then(async (r) => {
        if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error || 'Could not link that account.');
        return r.json();
      }),
    onSuccess: () => {
      setError('');
      invalidate();
    },
    onError: (ex: Error) => setError(ex.message),
  });

  const unlink = useMutation({
    mutationFn: () => rpc.api.users.atproto.$delete().then((r) => r.json()),
    onSuccess: invalidate,
  });

  if (status.isPending || !status.data) return null;

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const form = new FormData(evt.currentTarget);
    link.mutate({
      handle: String(form.get('handle') || ''),
      appPassword: String(form.get('appPassword') || ''),
    });
  };

  return (
    <div className={styles.followingBox}>
      <h2>
        <F defaultMessage="bluesky" />
      </h2>

      {status.data.linked ? (
        <>
          <p className="notranslate">@{status.data.handle}</p>
          <button type="button" onClick={() => unlink.mutate()} disabled={unlink.isPending}>
            <F defaultMessage="unlink" />
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="handle"
            className={`${styles.newFeedInput} notranslate`}
            placeholder={intl.formatMessage(messages.handle)}
            autoComplete="off"
          />
          <input
            type="password"
            name="appPassword"
            className={`${styles.newFeedInput} notranslate`}
            placeholder={intl.formatMessage(messages.appPassword)}
            autoComplete="off"
          />
          <button type="submit" disabled={link.isPending}>
            <F defaultMessage="link" />
          </button>
          {error ? <p role="alert">{error}</p> : null}
        </form>
      )}

      {status.data.webDid ? (
        <p className="notranslate" title="your AT Protocol identity">
          {status.data.webDid}
        </p>
      ) : null}
    </div>
  );
}
