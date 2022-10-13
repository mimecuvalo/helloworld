import { F, FormattedDate } from 'i18n';

import Favorite from './actions/Favorite';
import KeepUnread from './actions/KeepUnread';
import Reblog from './actions/Reblog';
import Reply from './actions/Reply';
import { styled } from 'components';

const StyledFooter = styled('footer')`
  position: sticky;
  bottom: 0;
  display: flex;
  font-size: 11px;
  box-shadow: 0px -1px 0 #0bf, 0 -9px 0 #fafafa;
  padding: 3px 6px 5px 3px;
  margin-top:  '12px',
  background: #fafafa;
`;

export default function Footer({
  contentRemote,
  keepUnreadCb,
}: {
  contentRemote: ContentRemote;
  keepUnreadCb: () => void;
}) {
  const { createdAt, link, updatedAt, username } = contentRemote;

  return (
    <StyledFooter>
      <div>
        <a href={link} target="_blank" rel="noopener noreferrer">
          <F
            defaultMessage="{username} posted on {date}"
            values={{
              username: username,
              date: (
                <time dateTime={createdAt}>
                  <FormattedDate
                    value={createdAt}
                    year="numeric"
                    month="long"
                    day="2-digit"
                    hour="2-digit"
                    minute="2-digit"
                  />
                </time>
              ),
            }}
          />
          {updatedAt && updatedAt !== createdAt && (
            <>
              &nbsp;
              <F
                defaultMessage="(updated {date})"
                values={{
                  date: (
                    <time dateTime={updatedAt}>
                      <FormattedDate
                        value={updatedAt}
                        year="numeric"
                        month="long"
                        day="2-digit"
                        hour="2-digit"
                        minute="2-digit"
                      />
                    </time>
                  ),
                }}
              />
            </>
          )}
        </a>
      </div>
      <div>
        <Reblog contentRemote={contentRemote} getEditor={getEditor} />
        &nbsp;•&nbsp;
        <Favorite contentRemote={contentRemote} isDashboard={true} />
        &nbsp;•&nbsp;
        <KeepUnread keepUnreadCb={keepUnreadCb} contentRemote={contentRemote} />
        &nbsp;•&nbsp;
        <Reply contentRemote={contentRemote} getEditor={getEditor} />
      </div>
    </StyledFooter>
  );
}
