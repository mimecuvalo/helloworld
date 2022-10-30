import { F, FormattedDate } from 'i18n';
import { Grid, Link, styled } from 'components';
import { Post, UserRemotePublic } from 'data/graphql-generated';

import Favorite from './actions/Favorite';
import KeepUnread from './actions/KeepUnread';
import Reblog from './actions/Reblog';
import Reply from './actions/Reply';

const StyledFooter = styled('footer')`
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  padding: ${(props) => props.theme.spacing(0.5, 1)};
  margin-top: ${(props) => props.theme.spacing(1)};
  background: ${(props) => props.theme.palette.background.default};

  &,
  & button {
    font-size: ${(props) => props.theme.typography.subtitle1.fontSize};
  }

  button {
    padding: ${(props) => props.theme.spacing(0, 0.5)};
    min-width: 0;
  }
`;

export default function Footer({
  contentRemote,
  keepUnreadCb,
}: {
  contentRemote: Post;
  // TODO(mime): match footer to the way regular Content->footer looks like
  userRemote: UserRemotePublic;
  keepUnreadCb: (keepUnread: boolean) => void;
}) {
  const { createdAt, link, updatedAt, username } = contentRemote;

  return (
    <StyledFooter>
      <Grid container item xs>
        <Link href={link} target="_blank">
          <F
            defaultMessage="{username} posted on {date}"
            values={{
              username: username,
              date: (
                <>
                  <br />{' '}
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
                </>
              ),
            }}
          />
          {updatedAt && updatedAt !== createdAt && (
            <>
              <br />
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
        </Link>
      </Grid>
      <Grid container item xs flexWrap="nowrap" alignItems="center" justifyContent="flex-end">
        <Reblog contentRemote={contentRemote} />
        <Favorite contentRemote={contentRemote} isDashboard={true} />
        <KeepUnread keepUnreadCb={keepUnreadCb} />
        <Reply />
      </Grid>
    </StyledFooter>
  );
}
