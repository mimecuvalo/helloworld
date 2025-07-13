<h1 align="center">
  🔮 Hello, world.
</h1>
<blockquote align="center">
  federated social web blog<br>
  using the foundation of <a href="https://github.com/mimecuvalo/all-the-things">all-the-things</a>
  <br>
</blockquote>

## 📯 Description

federated social web blog app. in short, i'm trying to build an open-source Tumblr (RIP). passes [SWAT0](https://indieweb.org/SWAT0)!

## ⚡ Features

- social features:
  - RSS reader
  - oStatus stack, WebSub/Salmon/Webfinger
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

## 💾 Install

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and [`all-the-things`](https://github.com/mimecuvalo/all-the-things).

```sh
yarn
```

_Prerequisites: Node 14+ if you want proper internationalization (i18n) support (via full-icu)._

## Getting Started

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `app/api/hello.ts`.

The `app/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

In dev or prod you'll want to setup your environment as well. Check out the `.env.example` file and `mv` it to `.env.development.local` (or `.env` for prod) and set the various variables:

- `NEXT_PUBLIC_DB*` for your database
- `NEXT_PUBLIC_SESSION_SECRET` for session management
- `NEXT_PUBLIC_AUTH0*` variables if you would like to use Auth0 for logging in

To run tests:

```sh
yarn test
```

To setup your DB:

```sh
cp prisma/.env.example prisma/.env
```

and set DATABASE_URL=postgresql://postgres:password@databasedomain.com:PORT/postgres

Then, to sync your DB:

```sh
npx prisma db push
```

To view your DB locally:

```sh
npx prisma studio
```

To learn more about Prisma, read the docs [here](https://www.prisma.io/).
Supabase is pretty great to get a good Postgres DB: https://app.supabase.io/

To add your name/email to relevant files:

```sh
yarn config
```

## 🎯 Goals

- pass [SWAT0](https://indieweb.org/SWAT0)
- open source
- quick to install
- be a good, straightforward-to-use alternative to what's out there!

## 🗺️ Roadmap

### p0 (high pri)

- create something that tests the website/salmon etc apis
- refix websub/pubsubhubbub
- creating comment doesn't load in comment properly (text missing)
- replying from dashboard when body of editor isn't selected throws error
- possible to pause compilation while building package?
- apostrophe in title makes it not hidden, e.g. Don-t-deploy-on-Fridays-wRXma4oxja
- Multiple app capable
- getting negative counts on dashboard - regression
- Fault tolerant http
- rm antiCache with migration to React hook <- needed anymore?
- Package directories build sanely
- Reader WordPress alt Tumblr alternative
- freeze HMR when re-building
- when done with editing doesn’t have latest version
- don't have edit link on feed page / or redirect to content page
- graphql errors should surface to top
- use rebound?
- end debugger debugger on run, to be safe?
- bin / fly prod should have npm corresponding command
- think about igor's feedback re css and other stuff
- high-res picture load in app, not new link
- hw loading old entries if purged prbly
- sorting should refresh feed
- pasting iframe into editor doesn’t work (npr video embed)
- fix img sizes in comments (too big - see example on nite-lite about page)
- Email is formatted wrong when getting webmention (says self sent email)
- don't update updatedAt for view
- migrate from user context to local state
- split off dashboard, admin panel, draft.js code, auth0, and lodash code for performance
- social api:
  - provide function to generate RSA
  - provide function to generate <head> html
  - remove XML version of webfinger
  - add JSON feeds
  - microsub/micropub
    - to test suite https://micropub.rocks/
  - litepub?
  - list library on indieweb wiki later when more mature
  - deprecate salmon, get rid of magic_keys - stick with public keys
  - get rid of local fields: comments_count and comments_updated, favorites_count, derive instead
  - move urls to constants (foaf, webfinger, etc.)
  - rename fields to be consistent
    - from_user: remoteProfileUrl,
    - local_content_name: localContentUrl,
    - to_username: localUsername,
    - logo -> avatar
  - maybe get rid of underscores vs camelCase
  - should go into a retry queue, async
  - remove FOAF probably
  - look at https://github.com/jasnell/activitystrea.ms library
    - https://test.activitypub.rocks/
  - look at https://github.com/glennjones/microformat-node
  - maybe indieauth - but probably not, hard to integrate into social-butterfly
  - maybe vouch or salmention? https://spec.indieweb.org/
  - fix https://indieweb-endpoints.cc for site
  - prbly move comments/favorites to separate 'social' table (also need to consolidate ‘local’ and ‘remote' comments)
  - publish to fediverse.party and the-federation.info and https://en.wikipedia.org/wiki/ActivityPub and https://en.wikipedia.org/wiki/Fediverse
  - check out https://fed.brid.gy/
  - see remote comments
  - hacky URI decorations
  - look into making a fed bridgy/granary translation
  - webmention: add like, other action verbs
    - should verify source
    - https://webmention.rocks/ to test suite
  - activitypub
    - verifyMessage - Digest header of body
    - undo (unfollow/unfavorite)
    - outbox
    - followers
    - ostatus:attention/mentioned (a la salmon)
    - thr:replies (a la salmon)
    - add salmon 'comment' type back for content.section === 'comment'
    - needs more work for gnusocial/friendica/pleroma/hubzilla interoperability
    - Linked Data Signatures for forwarded payloads.
    - if payload contains an attribution verify both actors
    - check out https://docs.joinmastodon.org/development/activitypub/
      - object IDs must use the https:// schema.
      - Servers must offer a WebFinger endpoint for turning usernames into actors.
      - Activities attributed to an actor must have an ID on the same host as the actor
      - https://activitypub.rocks/implementation-report/ (test suite broken?)
  - websub
    - switch to https://www.npmjs.com/package/websub-hub
    - or https://www.npmjs.com/package/websub
- twitter embed support
- editor
  - onbeforeleave fix after posting once
  - drop anywhere on page
  - don’t replace when uploading twice
  - don’t allow links to be clicked in editor
  - something wrong with toolbars editing (multiple)
  - grab thumb from first image (if pasted in)
  - when finishing editing doesn’t show new version
  - show uploading spinner
- fix linting / compilation checks in packages
- get rid of trailing slash on profile page
- make install instructions dead-simple, one-liner with mysql mock db setup.
- render HTML with inline styling (e.g. mentions)
- getting an error in graphql seems to freeze the apollo server. if so, update all-the-things, too.
- same Apollo query twice causes SSR to fail with htmlHead, wtf.
- more GraphQL examples:
  - fragments
    - also, things like fetchPublicUserData should be part of the graph not separate queries
  - local state
  - subscriptions
  - check out dataloader: https://github.com/graphql/dataloader
  - generate automatically schemas/typedefs
- generator steps for Sequelize files
- see if `lazy` attribute can be a good substitute for ContentThumb's delay-loading logic (chrome 75)
- finish up Admin panel to add/delete users
- loading state when following someone new
- incorrect url (i.e. with http:) follow error on dashboard

### p1 (medium pri)

- web components? (e.g. check out youtube.com)
- update material-ui with proper theme (instead of pixel.css)
- should follow self in dashboard, when posting new comment it goes to 'user remote' version.
- add site loading/working component, say when following a feed and it's working.
- hubspot's draft-extend / draft-convert might be a better route than draft-js-plugins, maybe combine the two editors
- more winston logging
- links template should only open embeds in lightbox?
- images open in lightbox
- editor features to bring back (from Python version)
  - use CSS-in-JS in editor package to avoid having to import separately
  - add snackbar close action
  - better emoji picker (can use EmojiOne's)
  - custom emojis
  - gotta fix @-mentioning for editing content (works for dashboard only now)
  - draft.js:
    - move paste code out of main index.js
    - custom tab behavior - draft.js's default is terrible
    - add markdown
      - https://github.com/withspectrum/draft-js-markdown-plugin
      - https://github.com/ngs/draft-js-markdown-shortcuts-plugin
      - --- for divider
    - add inline-code
    - add empty newline always at end of doc
    - image upload progress (or indeterminate loading "spinner")
    - unfurl should have "(via link)"
    - take a look at utils codebase: https://github.com/jpuri/draftjs-utils
    - code, use prism syntax highlighting
    - google maps embed
    - can’t import CSS for some reason into webpack from node_modules (from draft-js-plugins)
    - DraftEntity.get/create deprecated
    - multiple images - single undo instead of two (also when pasting unfurl)
    - use something instead of ' ‘ and ‘a’ for atomic blocks
    - convertFromHTML bug - this will fail `<figure> <img src=""> </figure>` but w/o whitespace won’t
    - toolbar don’t move on click (position so it doesn’t go off screen), get rid of scale
    - checklist / tasklist
    - dnd + align toolbars don’t actually work
    - htmlToEntity has extra data (entity and node both have the same data :-/), need to update attachment.js, unfurl.js, Iframe.js, Image.js, Blocks.js
  - create new sections / albums, renames (and redirects)
  - content rename (and redirects)
  - draggable, be able to drag album, sitemap, followers and move to different categories
  - some content is uneditable (like from `Simple.js`)
  - audio/video uploads
  - css/js live updates to wysiwyg
  - figcaption
- dashboard: better way to sandbox remote content?
- search should have InfiniteFeed
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
  <!--alex disable adult-->
  - newsletter, google analytics, basic ads, adult content flag
  - Structured data w movies music
  - content management
    - drag & drop to move sections
    - drag & drop to move content in albums
    - have hidden content
    - change section/album/thumb/hidden/template/thumb in content editor
    - be able to delete from within content editor
- friendica, other webfinger/host-meta tech
  - check out oexchange (see friendica)
  - check out amcd (see friendica)
  - why does friendica have salmon magic-key at top level host-meta file?
- dashboard/item.js update() is called so much there's a race condition and sometimes the apollo store gets -1

### p2 (ideas)

- look at/switch over to a React Hook

## 📙 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

### [Changelog](changelog.md)

### [Code of Conduct](code_of_conduct.md)

### [Contributing](contributing.md)

### [Contributors](contributors.md)

### [Support](support.md)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## 📜 License

[MIT](license.md)

(The format is based on [Make a README](https://www.makeareadme.com/))
