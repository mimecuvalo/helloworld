<h1 align="center">
  🔮 Hello, world.
</h1>
<blockquote align="center">
  federated social web blog<br>
  using the foundation of <a href="https://github.com/mimecuvalo/all-the-things">CRA-all-the-things</a>
  <br>
</blockquote>

<p align="center">
  <a href="https://travis-ci.com/mimecuvalo/helloworld">
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

federated social web blog app. in short, i'm trying to build an open-source Tumblr (RIP). passes [SWAT0](https://indieweb.org/SWAT0)!

## 💾 Install

```sh
npm install
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

To locally develop the packages `hello-world-editor` and `social-butterfly`, run:

```sh
./setup_local_dev_environment.sh

# To live update hello-world-editor code:
cd packages/hello-world-editor; npm run build

# To live update social-butterfly code:
cd packages/social-butterfly; npm run build
```

To run tests:

```sh
npm run test
```

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

## 🎯 Goals

- pass [SWAT0](https://indieweb.org/SWAT0)
- open source
- quick to install
- be a good, straightforward-to-use alternative to what's out there!

## 📙 Learn More

### [Changelog](changelog.md)

### [Code of Conduct](code_of_conduct.md)

### [Contributing](contributing.md)

### [Contributors](contributors.md)

### [Support](support.md)

## 📜 License

[MIT](license.md)

(The format is based on [Make a README](https://www.makeareadme.com/))
