<h1 align="center">
  🔮 Hello, world.
</h1>
<blockquote align="center">
  federated social web blog<br>
  using the foundation of [CRA-all-the-things](https://github.com/mimecuvalo/all-the-things)
  <br>
</blockquote>

<p align="center">
  <a href="https://travis-ci.org/mimecuvalo/helloworld">
    <img src="https://img.shields.io/travis/mimecuvalo/helloworld.svg" alt="CI status" />
  </a>
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg" alt="CI status" />
  </a>
  <a href="https://github.com/username/project/docs/license.md">
    <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="license" />
  </a>
</p>

<strong>NOTE: still under active development and I'm not currently providing backwards compatibility until things stabilize.</strong>

## 📯 Description

federated social web blog app. basically, i'm trying to build an open-source Tumblr (RIP). passes [SWAT0](https://indieweb.org/SWAT0)!

## 💾 Install

```sh
npx create-react-app react-all-the-things --use-npm --scripts-version=all-the-things
```

Then, to run your newly created server locally, **with** the Storybook styleguide server:

```sh
npm start
```

Or, to run locally **without** the Storybook styleguide server:

```sh
npm run serve:dev
```

To run in production (or better yet check out bin/flightplan.js)
```sh
npm --production install
npm run serve:prod
```

To run tests:
```sh
npm run test
```

## ⚡ Features

- social features:
  - RSS reader
  - oStatus stack, PuSH/Salmon/Webfinger
  - commenting
  - api to follow/reblog content (pretty basic right now)
- WYSIWYG editor
  - edit content in page, or add new content via dashboard
  - rich content pasting (paste in url/embed and we'll grab the video or image)
  - tagging objects through #catvideo and people @bestfriendforevs
  - different templates (namely, albums currently)
  - CSS/JS/HTML editing via CodeMirror
- technology features:
  - foundation: [CRA-all-the-things](https://github.com/mimecuvalo/all-the-things)
  - Auth0 for logging

## 🎯 Goals

- pass [SWAT0](https://indieweb.org/SWAT0)
- open source
- easy to install
- be a good, easy-to-use alternative to what's out there!

## 🗺️ Roadmap

### p0 (high pri)

- separate packages for editor and socialize api
  - take a look at lerna: https://medium.com/@luisvieira_gmr/building-large-scale-react-applications-in-a-monorepo-91cd4637c131
- social features
  - verify oStatus support, follow/favorite/reply, unfollow (skip xsrf, also push/pubsub), with status.net (a.k.a. gnu social), friendi.ca, Pleroma, socialhome, hubzilla
  - reference: https://ostatus.readthedocs.io/en/latest/data_structures.html
  - activitypub
    - alternate: https://github.com/dariusk/rss-to-activitypub
  - verify webmention working again
  - publish to fediverse.party and the-federation.info and https://en.wikipedia.org/wiki/ActivityPub and https://en.wikipedia.org/wiki/Fediverse
  - check out https://fed.brid.gy/
  - mastodon compatibility
  - see remote comments
  - WebSub (pubsubhubbub)
  - see if ostatus is still case-sensitive, if not make all lower case foaf, webfinger, host_meta, too confusing with react warnings
- same Apollo query twice causes SSR to fail with htmlHead, wtf.
- more GraphQL examples:
  - fragments
    - also, things like fetchPublicUserData should be part of the graph not separate queries
  - local state
  - subscriptions
  - check out dataloader: https://github.com/graphql/dataloader
  - generate automatically schemas/typedefs

### p1 (medium pri)

- web components? (e.g. check out youtube.com)
- update material-ui with proper theme (instead of pixel.css)
- hubspot's draft-extend / draft-convert might be a better route than draft-js-plugins, maybe combine the two editors
- links template just open embeds in lightbox?
- editor features to bring back (from Python version)
  - better emoji picker (can use EmojiOne's)
  - custom emojis
  - draft.js:
    - custom tab behavior - draft.js's default is lame
    - add markdown
      - https://github.com/withspectrum/draft-js-markdown-plugin
      - https://github.com/ngs/draft-js-markdown-shortcuts-plugin
      - --- for divider
    - add inline-code
    - take a look at utils codebase: https://github.com/jpuri/draftjs-utils
    - code, use prism syntax highlighting
    - google maps embed
    - can’t import CSS for some reason into webpack from node_modules (from draft-js-plugins)
    - DraftEntity.get/create deprecated
    - multiple images - single undo instead of two (also when pasting unfurl)
    - use something instead of ' ‘ and ‘a’ for atomic blocks
    - convertFromHTML bug - this will fail `<figure>    <img src="">  </figure>` but w/o whitespace won’t
    - toolbar don’t move on click (position so it doesn’t go off screen), get rid of scale
    - checklist / tasklist
    - dnd + align toolbars don’t actually work
  - create new sections / albums, renames (and redirects)
  - content rename (and redirects)
  - draggable, be able to drag album, sitemap, followers and move to different categories
  - simple content is uneditable
  - audio/video uploads
  - css/js live updates to wysiwyg
  - figcaption
- dashboard: better way to sandbox remote content?
- bring back old features (from Python version)
  - data liberation, ability to port data to another site/service
  - themes
  - forums
  - events
  - store
  - slideshow
  - favorites and shares
  - spam control
  - webfinger if http://ostatus.org/schema/1.0/subscribe present then show Follow button for user
  - fb/google+/twitter mirroring (backwards compatibility ;)
  - media manager: had support for video/audio/images
  - resumable uploads
  - edit images
  - newsletter, google analytics, basic ads, adult content flag
  - Structured data w movies music
  - content management
    - drag & drop to move sections
    - drag & drop to move content in albums
    - have hidden content

## 📙 Learn More

### [Changelog](changelog.md)

### [Code of Conduct](code_of_conduct.md)

### [Contributing](contributing.md)

### [Contributors](contributors.md)

### [Support](support.md)

## 📜 License

[MIT](license.md)

(The format is based on [Make a README](https://www.makeareadme.com/))
