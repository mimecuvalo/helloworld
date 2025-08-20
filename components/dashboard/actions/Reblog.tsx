import { Button } from 'components';
import { Post } from 'data/graphql-generated';
import { useEditor } from 'application/EditorContext';
import { reblog } from '../util';
import { RepeatOutlined } from '@mui/icons-material';
import { defineMessages, useIntl } from '@/i18n';

const messages = defineMessages({
  reblog: { defaultMessage: 'Reblog' },
});

export default function Reblog({ contentRemote }: { contentRemote: Post }) {
  const { editor } = useEditor();
  const intl = useIntl();
  const type = contentRemote.type;

  const handleClick = () => {
    if (!editor || contentRemote.type === 'remote-comment') return;

    reblog(editor, contentRemote.link, contentRemote.link);
  };

  return (
    <Button onClick={handleClick} disabled={type === 'remote-comment'} title={intl.formatMessage(messages.reblog)}>
      <RepeatOutlined />
    </Button>
  );
}
