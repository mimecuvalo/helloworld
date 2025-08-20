import { useEditor } from 'application/EditorContext';
import { Post } from '@/data/graphql-generated';
import { Button } from 'components';
import { defineMessages, useIntl } from 'i18n';
import { ReplyOutlined } from '@mui/icons-material';

const messages = defineMessages({
  reply: { defaultMessage: 'replying to' },
  replyTo: { defaultMessage: 'Reply to' },
});

export default function Reply({ contentRemote }: { contentRemote: Post }) {
  const { editor } = useEditor();
  const intl = useIntl();

  const handleClick = () => {
    const { type, link } = contentRemote;
    if (type === 'remote-comment') {
      window.open(link, link, 'noopener,noreferrer');
      return;
    }

    // TODO(mime): in future would be great to send html.
    const replyingToMsg = intl.formatMessage(messages.reply);
    editor?.commands.insertContent(`${replyingToMsg} > ${link}`);
  };

  return (
    <Button onClick={handleClick} title={intl.formatMessage(messages.replyTo)}>
      <ReplyOutlined />
    </Button>
  );
}
