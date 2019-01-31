<h1 align="center">
  🔮 Hello, world.
</h1>
<blockquote align="center">
  federated social web blog<br>
  using the foundation of [CRA-all-the-things](https://github.com/mimecuvalo/all-the-things)
  <br>
  UNDER REDEVELOPMENT - DO NOT USE - NOT QUITE READY FOR BROAD USE YET!
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

## 📯 Description

federated social web blog app. basically, i'm trying to build an open-source Tumblr (RIP). passes [SWAT0](https://indieweb.org/SWAT0)!


## 🔨 Install

To run locally:

```sh
npm install
npm start # or you can do npm run serve:dev if you don't need the styleguide server.
```

To run tests:

```sh
npm run test
```

for production use:
```sh
npm install
npm run serve:prod
```

## ⚡ Features
- social features:
  - RSS reader
  - oStatus stack, PuSH/Salmon/Webfinger
  - be able to comment
  - spam control
  - api to follow/reblog content (pretty basic right now)
  - fb/google+/twitter mirroring (backwards compatibility ;)
- WYSIWYG editor
  - edit content in page, or add new content via dashboard
  - media manager (get oembed/open graph info from websites)
  - rich content pasting (paste in url/embed and we'll grab the video or image)
  - tagging objects through #catvideo and people @bestfriendforevs
  - feed/events/links/store/slideshow templates
  - CSS/JS/HTML editing via CodeMirror
  - resumable uploads via resumable.js
- content management
  - drag & drop to move sections
  - drag & drop to move content in albums
  - have hidden content
- technology features:
  - foundation: [CRA-all-the-things](https://github.com/mimecuvalo/all-the-things)
  - spam control
  - Auth0 for logging
  - data liberation, ability to port data to another site/service

## 🎯 Goals
- pass (SWAT0)[https://indieweb.org/SWAT0]
- open source
- easy to install
- be a good, easy-to-use alternative to what's out there!

## 📙 Learn More

### [Changelog](changelog.md)

### [Code of Conduct](code_of_conduct.md)

### [Contributing](contributing.md)

### [Contributors](contributors.md)

### [Support](support.md)

## 📜 License

[MIT](license.md)

(The format is based on [Make a README](https://www.makeareadme.com/))
