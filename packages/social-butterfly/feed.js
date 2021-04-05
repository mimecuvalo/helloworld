import { buildUrl } from './util/url_factory';
import { HTTPError } from './util/exceptions';
import { createElement as RcE } from 'react';
import { renderToString } from 'react-dom/server';

const LICENSES = {
  'http://creativecommons.org/licenses/by/3.0/': {
    name: 'Creative Commons Attribution 3.0 Unported License',
    img: 'https://i.creativecommons.org/l/by/3.0/88x31.png',
  },
  'http://creativecommons.org/licenses/by-sa/3.0/': {
    name: 'Creative Commons Attribution-ShareAlike 3.0 Unported License',
    img: 'https://i.creativecommons.org/l/by-sa/3.0/88x31.png',
  },
  'http://creativecommons.org/licenses/by-nd/3.0/': {
    name: 'Creative Commons Attribution-NoDerivs 3.0 Unported License',
    img: 'https://i.creativecommons.org/l/by-nd/3.0/88x31.png',
  },
  'http://creativecommons.org/licenses/by-nc/3.0/': {
    name: 'Creative Commons Attribution-NonCommercial 3.0 Unported License',
    img: 'https://i.creativecommons.org/l/by-nc/3.0/88x31.png',
  },
  'http://creativecommons.org/licenses/by-nc-sa/3.0/': {
    name: 'Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License',
    img: 'https://i.creativecommons.org/l/by-nc-sa/3.0/88x31.png',
  },
  'http://creativecommons.org/licenses/by-nc-nd/3.0/': {
    name: 'Creative Commons Attribution-NonCommercial-NoDerivs 3.0 Unported License',
    img: 'https://i.creativecommons.org/l/by-nc-nd/3.0/88x31.png',
  },
  'http://purl.org/atompub/license#unspecified': {
    name: 'Simple Copyright',
    img: '',
  },
  'http://www.opensource.org/licenses/mit-license.php': {
    name: 'MIT License',
    img: '',
  },
};

export default (options) => async (req, res, next) => {
  const contentOwner = await options.getLocalUser(req.query.resource, req);
  if (!contentOwner) {
    return res.sendStatus(404);
  }
  const feed = await options.getLocalLatestContent(req.query.resource, req);

  let renderedTree = `<?xml version='1.0' encoding='UTF-8'?>` +
    renderToString(<ContentFeed req={req} feed={feed} contentOwner={contentOwner} constants={options.constants} />);
  // XXX(mime): in the feeds I have some attributes that are `ref`. However, ref isn't allowed in React,
  // so in the DOM they are `refXXX`. Return them to normal here, sigh.
  renderedTree = renderedTree.replace(/refXXX="([^"]+)"/g, 'ref="$1"');

  res.type('xml');
  res.send(renderedTree);
};

function ContentFeed({ feed, contentOwner, constants, req }) {
  const updatedAt = feed.length && feed[0].updatedAt;

  return (
    <GenericFeed contentOwner={contentOwner} constants={constants} req={req} updatedAt={updatedAt}>
      {feed.map(content => (
        <Entry key={content.name} content={content} req={req} />
      ))}
    </GenericFeed>
  );
}

export function GenericFeed({ req, children, constants, contentOwner, updatedAt }) {
  if (!contentOwner) {
    throw new HTTPError(404, undefined, 'feed: no content owner');
  }

  const feedUrl = buildUrl({ req, pathname: req.originalUrl });
  const salmonUrl = buildUrl({ req, pathname: '/api/social/salmon', searchParams: { resource: contentOwner.url } });

  const namespaces = {
    xmlLang: 'en-US',
    xmlns: 'http://www.w3.org/2005/Atom',
    'xmlns:activity': 'http://activitystrea.ms/spec/1.0/',
    'xmlns:poco': 'http://portablecontacts.net/spec/1.0',
    'xmlns:media': 'http://purl.org/syndication/atommedia',
    'xmlns:thr': 'http://purl.org/syndication/thread/1.0',
  };

  return (
    <feed {...namespaces}>
      <generator uri="https://github.com/mimecuvalo/helloworld">Hello, world.</generator>
      <id>{feedUrl}</id>
      <title>{contentOwner.title}</title>
      <subtitle>a hello world site.</subtitle>
      <link rel="self" href={feedUrl} />
      <link rel="alternate" type="text/html" href={contentOwner.url} />
      <link rel="hub" href={constants.webSubHub} />
      <link rel="salmon" href={salmonUrl} />
      <link rel="http://salmon-protocol.org/ns/salmon-replies" href={salmonUrl} />
      <link rel="http://salmon-protocol.org/ns/salmon-mention" href={salmonUrl} />
      <link rel="license" href={contentOwner.license} />
      {contentOwner.license ? (
        <rights>
          {contentOwner.license === 'http://purl.org/atompub/license#unspecified'
            ? `Copyright ${new Date().getFullYear()} by ${contentOwner.name}`
            : `${LICENSES[contentOwner.license]?.['name']}: ${contentOwner.license}`}
        </rights>
      ) : null}
      {updatedAt ? <updated>{new Date(updatedAt).toISOString()}</updated> : null}
      <Author contentOwner={contentOwner} />
      {contentOwner.logo ? <logo>{buildUrl({ req, pathname: contentOwner.logo })}</logo> : null}
      <icon>
        {contentOwner.favicon
          ? buildUrl({ req, pathname: contentOwner.favicon })
          : buildUrl({ req, pathname: '/favicon.ico' })}
      </icon>

      {children}
    </feed>
  );
}

const Author = ({ contentOwner }) => (
  <author>
    {RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/person`)}
    <name>{contentOwner.name}</name>
    <uri>{contentOwner.url}</uri>
    <email>{contentOwner.email}</email>
    {RcE('poco:preferredusername', {}, contentOwner.username)}
    {RcE('poco:displayname', {}, contentOwner.name)}
    {RcE('poco:emails', {}, [
      RcE('poco:value', { key: 'value' }, contentOwner.email),
      RcE('poco:type', { key: 'type' }, 'home'),
      RcE('poco:primary', { key: 'primary' }, 'true'),
    ])}
    {RcE('poco:urls', {}, [
      RcE('poco:value', { key: 'value' }, contentOwner.url),
      RcE('poco:type', { key: 'type' }, 'profile'),
      RcE('poco:primary', { key: 'primary' }, 'true'),
    ])}
  </author>
);

function Entry({ content, req }) {
  const statsImgSrc = buildUrl({ req, pathname: '/api/stats', searchParams: { resource: content.url } });
  const statsImg = `<img src="${statsImgSrc}" />`;
  const absoluteUrlReplacement = buildUrl({ req, pathname: '/resource' });

  // TODO(mime): this replacement is nite-lite specific...
  const html =
    '<![CDATA[' + content.view.replace(/(['"])\/resource/gm, `$1${absoluteUrlReplacement}`) + statsImg + ']]>';
  const repliesUrl = buildUrl({ pathname: '/api/social/comments', searchParams: { resource: content.url } });
  const repliesAttribs = {
    'thr:count': content.comments_count,
    'thr:updated': new Date(content.comments_updated).toISOString(),
  };

  return (
    <entry>
      <title>{content.title}</title>
      <link href={content.url} />
      <id>
        {content.url}
      </id>
      <content type="html" dangerouslySetInnerHTML={{ __html: html }} />
      <published>{new Date(content.createdAt).toISOString()}</published>
      <updated>{new Date(content.updatedAt).toISOString()}</updated>
      {RcE('activity:verb', {}, `http://activitystrea.ms/schema/1.0/post`)}
      {content.section === 'comments' ? (
        /* XXX(mime): we'll never get here currently because we never render main sections in our feed */
        <>
          {RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/comment`)}

          {/* see endpoint_with_apollo for refXXX transform */}
          {content.thread ? RcE('thr:in-reply-to', { refXXX: content.thread }) : null}

          {content.thread_user ? (
            <>
              <link rel="ostatus:attention" href={content.thread_user} />
              <link rel="mentioned" href={content.thread_user} />
            </>
          ) : null}
        </>
      ) : (
        RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/article`)
      )}
      {content.comments_count ? (
        <link rel="replies" type="application/atom+xml" href={repliesUrl} {...repliesAttribs} />
      ) : null}
    </entry>
  );
}
