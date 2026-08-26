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
  - RSS reader — follows Atom, RSS, ActivityPub and AT Protocol accounts side by side
  - oStatus stack, WebSub/Salmon/Webfinger
  - **ActivityPub**: two-way with Mastodon — signed delivery to followers, actor
    collections (outbox/followers/following), NodeInfo, and inbound
    Create/Update/Delete/Follow/Like/Announce/Undo
  - **AT Protocol**: a `did:web` identity plus a read-only XRPC surface, and a
    Bluesky bridge that mirrors your posts and pulls followed accounts into the
    reader. (Not a PDS — see below.)
  - feeds published as both Atom and RSS 2.0
  - blogroll published as OPML at `/blogs.opml.xml` (and `/:username/blogs.opml.xml`)
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
  - Auth.js for logging

### A note on the AT Protocol support

The app serves a `did:web` identity (`/.well-known/did.json`, or
`/<username>/did.json` on a shared host) and answers a handful of read-only XRPC
methods at `/xrpc/*` — `com.atproto.repo.describeRepo`, `listRecords`,
`getRecord`, `app.bsky.actor.getProfile` and `app.bsky.feed.getAuthorFeed` —
projecting posts as `app.bsky.feed.post` records with real dag-cbor CIDs.

It is **not** a Personal Data Server: there are no signed repo commits, no MST,
and no `com.atproto.sync.*`, so relays won't index it and Bluesky clients won't
resolve it as a repo host. Actual two-way interop runs through the bridge —
link a Bluesky account in the dashboard (handle + app password) and posts mirror
there, while following an `@handle.bsky.social` pulls that account's feed into
your reader.

## 💾 Install

A [TanStack Start](https://tanstack.com/start) app (React 19 + Vite + Nitro) with
a [Hono](https://hono.dev) backend and Prisma over Postgres, managed with
[bun](https://bun.sh).

```sh
bun install
```

_Prerequisites: Node 22+._

## Getting Started

First, run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To run tests:

```sh
bun run test
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

## 📙 Learn More

### [Changelog](changelog.md)

### [Code of Conduct](code_of_conduct.md)

### [Contributing](contributing.md)

### [Contributors](contributors.md)

### [Support](support.md)

## 📜 License

[MIT](license.md)

(The format is based on [Make a README](https://www.makeareadme.com/))
