import { F } from 'react-intl-wrapper';
import classNames from 'classnames';
import useStyles from './actionsStyles';

export default function Reblog({ contentRemote, getEditor }) {
  const type = contentRemote.type;
  const styles = useStyles();

  const handleClick = (evt) => {
    const type = contentRemote.type;
    if (type === 'remote-comment') {
      return;
    }

    // TODO(mime): in future would be great to send html.
    getEditor().reblog(contentRemote.link);
  };

  return (
    <button
      onClick={handleClick}
      className={classNames('hw-button-link', { [styles.disabled]: type === 'remote-comment' })}
    >
      <F msg="reblog" />
    </button>
  );
}
