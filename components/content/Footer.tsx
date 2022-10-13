import { F, FormattedDate } from 'i18n';
import { contentUrl, profileUrl } from 'util/url-factory';

import { styled } from 'components';

const StyledFooter = styled('footer')`
  position: sticky;
  bottom: -1, // XXX: chrome has a bit of a problem here with content leaking out
  background: #111;
  z-index: 1,

  font-size: 11px;
  color: #666;
  border-top: 1px solid #ccc;
  padding: 6px 10px;

  & img {
    float: left;
    width: 16px;
    height: 16px;
    margin-right: 10px;
    margin-top:  2,
  }
`;

export default function Footer({ content, contentOwner }: { content: Content; contentOwner: string }) {
  const { count, count_robot, createdAt, username } = content;
  const name = contentOwner.name || username;

  const handleFullscreen = (evt) => {
    document.getElementById('hw-content').requestFullscreen();
  };

  return (
    <StyledFooter>
      <span className="p-author h-card">
        <a key="img" href={profileUrl(username)} className="u-url u-uid icon-container">
          <img className="u-photo" src={contentOwner.logo || contentOwner.favicon} alt={name} />
        </a>
        <a key="name" href={profileUrl(username)} className="p-name fn u-url u-uid url notranslate">
          {name}
        </a>
      </span>
      <span className="notranslate">:&nbsp;</span>
      <F
        defaultMessage="posted {date}"
        values={{
          date: (
            <time className="t-published" dateTime={createdAt}>
              <FormattedDate value={createdAt} year="2-digit" month="2-digit" day="2-digit" />
            </time>
          ),
        }}
      />
      <span className="notranslate">&nbsp;•&nbsp;</span>
      <a href={contentUrl(content)} target="_blank" rel="bookmark noopener noreferrer">
        <F defaultMessage="permalink" />
      </a>
      <span className="notranslate">&nbsp;•</span>
      <button className="hw-button-link" onClick={handleFullscreen}>
        <F defaultMessage="fullscreen" />
      </button>
      <span className="notranslate">•&nbsp;</span>
      <F
        defaultMessage="{count, plural, =0 {no human views} one {# human view} other {# human views}}"
        values={{ count: count }}
      />
      <span className="notranslate">&nbsp;•&nbsp;</span>
      <F
        defaultMessage="{count, plural, =0 {no robot views} one {# robot view} other {# robot views}}"
        values={{ count: count_robot }}
      />
      {content.thread ? (
        <>
          <span className="notranslate">&nbsp;•&nbsp;</span>
          <a href={content.thread} target="_blank" rel="noopener noreferrer">
            <F defaultMessage="view thread" />
          </a>
        </>
      ) : null}
    </StyledFooter>
  );
}
