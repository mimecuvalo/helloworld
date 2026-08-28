import { type ClipboardEvent } from 'react';
import { Menu } from '@base-ui/react/menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { F, defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import type { HandleSetFeed, RemoteUser } from 'lib/remote-queries';
import styles from '../dashboard.module.css';

const messages = defineMessages({
  follow: { defaultMessage: 'paste url to follow' },
});

export default function NewFeed({
  profileUrl,
  isButton,
  handleSetFeed,
}: {
  profileUrl?: string;
  isButton?: boolean;
  handleSetFeed: HandleSetFeed;
}) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (url: string) =>
      rpc.api['users-remote'].follow.$post({ json: { profileUrl: url } }).then((r) => r.json() as Promise<RemoteUser>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relations'] });
      queryClient.invalidateQueries({ queryKey: ['counts'] });
    },
  });

  const addNewFeed = async (url: string) => {
    const created = await mutation.mutateAsync(url);
    handleSetFeed(created);
  };

  const handleNewFeedPaste = (evt: ClipboardEvent<HTMLInputElement>) => {
    const inputField = evt.target as HTMLInputElement;
    // The <input> value isn't set yet on paste, so defer a tick.
    setTimeout(() => {
      const url = inputField.value;
      inputField.value = '';
      inputField.blur();
      addNewFeed(url);
    }, 0);
  };

  if (isButton) {
    return (
      <Menu.Item className={styles.menuItem} onClick={() => addNewFeed(profileUrl || '')}>
        <F defaultMessage="follow back" />
      </Menu.Item>
    );
  }

  return (
    <input
      type="text"
      className={`${styles.newFeedInput} notranslate`}
      placeholder={intl.formatMessage(messages.follow)}
      onPaste={handleNewFeedPaste}
    />
  );
}
