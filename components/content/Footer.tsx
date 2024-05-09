import { Avatar, Link, styled } from 'components';
import { Content, UserPublic } from 'data/graphql-generated';
import { F, FormattedDate } from 'i18n';
import { contentUrl, profileUrl } from 'util/url-factory';

const StyledFooter = styled('footer')`
  position: sticky;
  bottom: ${(props) => props.theme.spacing(1)};
  display: flex;
  align-items: center;
  background: ${(props) => props.theme.palette.background.default};
  white-space: nowrap;
  flex-wrap: wrap;

  &,
  button {
    font-size: ${(props) => props.theme.typography.subtitle1.fontSize};
  }

  button {
    font-weight: normal;
    padding: 0;
    min-width: 0;
  }

  color: ${(props) => props.theme.palette.grey[500]};
  border: 1px solid ${(props) => props.theme.palette.primary.light};
  box-shadow:
    1px 1px ${(props) => props.theme.palette.primary.light},
    2px 2px ${(props) => props.theme.palette.primary.light},
    3px 3px ${(props) => props.theme.palette.primary.light};
  padding: ${(props) => props.theme.spacing(0.5, 1)};
`;

export default function Footer({ content, contentOwner }: { content: Content; contentOwner: UserPublic }) {
  const { count, countRobot, createdAt, username } = content;
  const name = contentOwner.name || username;

  return (
    <StyledFooter>
      <span className="p-author h-card" style={{ display: 'flex', alignItems: 'center' }}>
        <Link key="img" href={profileUrl(username)} className="u-url u-uid icon-container" sx={{ mr: 1 }}>
          <Avatar
            className="u-photo"
            src={contentOwner.logo || contentOwner.favicon || ''}
            alt={name}
            sx={{ width: 16, height: 16 }}
          />
        </Link>
        <Link key="name" href={profileUrl(username)} className="p-name fn u-url u-uid url notranslate">
          {name}
        </Link>
      </span>
      <span className="notranslate">&nbsp;•&nbsp;</span>
      <Link href={contentUrl(content)}>
        <F
          defaultMessage="{date}"
          values={{
            date: (
              <time className="t-published" dateTime={createdAt}>
                <FormattedDate value={createdAt} year="2-digit" month="2-digit" day="2-digit" />
              </time>
            ),
          }}
        />
      </Link>
      <span className="notranslate">&nbsp;•&nbsp;</span>
      <F
        defaultMessage="{count, plural, =0 {no human views} one {# human view} other {# human views}}"
        values={{ count: count }}
      />
      <span className="notranslate">&nbsp;•&nbsp;</span>
      <F
        defaultMessage="{count, plural, =0 {no robot views} one {# robot view} other {# robot views}}"
        values={{ count: countRobot }}
      />
      {content.thread ? (
        <>
          <span className="notranslate">&nbsp;•&nbsp;</span>
          <Link href={content.thread} target="_blank">
            <F defaultMessage="view thread" />
          </Link>
        </>
      ) : null}
    </StyledFooter>
  );
}
