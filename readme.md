# hello, world.

## description

federated social web tumblr/blog/rss reader/wordpress-like app to be used on
shared servers.  passes swat0!

## features
- ostatus stack, PuSH/Salmon/Webfinger
- edit content in page, or add new content via dashboard
- media manager (get oembed/open graph info from websites)
- rich content pasting (paste in url/embed and we'll grab the video or image)
- REST-style editing
- spam control
- rss reader
- tagging objects through #catvideo and people @bestfriendforevs
- feed/events/links/store/slideshow templates
- pretty css/js/html editing via codemirror
- album template using html5 history for nicer transitions between pages
- browserid for logins, fallback to oauth
- edit images via pixastic
- resumable uploads via resumable.js
- have hidden content (not private content - that's on the todo list though)
- drag & drop to move sections
- drag & drop to move content in albums
- data liberation, ability to port data to another site/service
- api to follow/reblog content (pretty basic right now)
- ability to add translations
- caching (limited to disk caching for now; shared servers, mang!)
- fb/google+/twitter mirroring (backwards compatibility ;)
- other customization extras: newsletter, google analytics, basic ads, adult
  content age check, license

## setting up the repository

`Hello, world.` has a dependency on the
[tornado](https://github.com/facebook/tornado) library so it's a couple more
steps than just cloning.

    git clone git://github.com/mimecuvalo/helloworld.git
    git submodule init
    git submodule update


## goals
- be able to run on shared servers (hence, use of mod\_rails/fcgi instead of
  ioloop)
- pass swat0
- open source
- easy to install
- be a good, easy-to-use alternative to what's out there!

## todo (hey, intrepid open source developer! check out all this stuff you
## could help work on! email me: mimecuvalo@gmail.com)
- privacy
- possibly: wiki
- possibly: multiple blogs per person
- possibly: django port?
- possibly: js "templating" - be able to add microformatting,
  creativeworks/recipes/person, schema.org
- reduce/cache mysql calls
- make oauth on the server so that external apps can plug in?
- mysql migrator
- tag editing is meh (deleting tags too)
- don't refresh on new section/album
- full templates possibly (also shouldn't make copy of non-edited css)
- plugins?
- translations (UI like [pontoon](https://github.com/mathjazz/pontoon))
