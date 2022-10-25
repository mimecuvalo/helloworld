migration notes

- push up to Vercel

- StructuredMetaData/OpenGraphMetadata/rel="canonical" needs absolute urls
- why so many network requests
- editor - switch to new editor
- reduce prisma queries for frontend
- remove draft.js garbage - switch to markdown
- image upload / resources go to s3 bucket
- s3 url migration / rewrite
  use md5 of user email
- console errors
- allow unfurl (pasting of iframe link)
- image "u-photo" ?
- u-in-reply-to Reply > to microblog
- make sure cvjecarnica still works
- cron jobs
  - db backup
    // Updates at 1am every night.
    import schedule from 'node-schedule';
    schedule.scheduleJob('updateFeeds', '0 1 \* \* \*', () => updateFeeds(options));
  - vercel pings
  - rss reader updates/social butterfly
- get rid of local state in att?
- app.use(bodyParser.text({ type: 'application/magic-envelope+xml' }));
- make sure private_key isn't being sent down
- transfer domains from digital ocean
- tests pass
- upgrade packages and close unrelated dependabot PRs
- use next image in places, styled('img')
- get rid of <a> tags
- fix up editing entries in place
- convert buttons/avatar over to mui, e.g. styled('button')
- re-enable editing style/js
- use mui breakpoints
- re-package social-butterfly, or get rid of
- fix todos
- for some reason was doing this?
  // TODO(mime): hacky - how can we unify this (here and wherever we use syndicate())
  currentUser.url = profileUrl(currentUsername, req);
- joy-ui?
- get rid of social-butterfly package?
