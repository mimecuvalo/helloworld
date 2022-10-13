migration notes

data

- resolvers
- loaders? add to context.ts like https://github.com/mimecuvalo/helloworld/blob/legacy_create_react_app/server/data/apollo.js

- migrate: createUseStyles
- editor - switch to new editor
- remove draft.js garbage - switch to markdown
- image upload / resources go to s3 bucket
- s3 url migration / rewrite
- allow unfurl (pasting of iframe link)
- image "u-photo" ?
- u-in-reply-to Reply > to microblog
- make sure cvjecarnica still works
- pixel.css
- cron jobs
  - db backup
  - vercel pings
  - rss reader updates/social butterfly
- get rid of local state in att?
- app.use(bodyParser.text({ type: 'application/magic-envelope+xml' }));
- make sure private_key isn't being sent down
- transfer domains from digital ocean
- router
  /:username/search/:query
  `/:username/:section/:album/:name`,
  `/:username/:section/:name`,
  `/:username/:name`,
  `/:username`,
  `/`,
- HTMLHead graft
- typescript pass
- tests pass
- upgrade packages and close unrelated dependabot PRs
- use next image in places
- fix up editing entries in place
- disallow any
- convert buttons/avatar over to mui, e.g. styled('button')
- re-enable editing style/js
- use mui breakpoints
- re-package social-butterfly, or get rid of
