# hello, world.

## description

federated social web tumblr/blog/wordpress-like app to be used on shared servers.  passes swat0(?) i think i'm missing one last step with comments.

## features
- ostatus stack, PuSH/Salmon/Webfinger
- edit content in page, or add new content via dashboard
- media manager (get oembed/open graph info from websites)
- REST-style editing
- spam control
- tagging objects through #catvideo and people @bestfriendforevs
- feed/events/links/store/slideshow templates
- pretty css/js/html editing via codemirror
- album template using html5 history for nicer transitions between pages
- browserid for logins, fallback to oauth
- edit images via pixastic
- have hidden content (not private content - that's on the todo list though)
- drag & drop to move sections
- drag & drop to move content in albums
- data liberation, ability to port data to another site/service
- api to follow/reblog content (pretty basic right now)
- ability to add translations
- caching (limited to disk caching for now; shared servers, mang!)
- other customization extras: newsletter, google analytics, basic ads, adult content age check, license

## goals
- be able to run on shared servers (hence, use of mod\_rails/fcgi instead of ioloop)
- pass swat0
- open source
- easy to install
- be a good, easy-to-use alternative to what's out there!

## todo
- js "templating" - be able to add microformatting to content easily
