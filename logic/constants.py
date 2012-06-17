defaults = {
  'use_mod_rails': 1,
  'http_prefix' : '',
  'http_hide_prefix': 0,
  'https_prefix' : '',
  'xsrf_secret' : '',
  'mysql_database' : '',
  'mysql_host' : '',
  'mysql_user' : '',
  'mysql_password' : '',
  'smtp_password' : '',
  'twitter_consumer_key' : '',
  'twitter_consumer_secret' : '',
  'google_api_key' : '',
  'google_secret' : '',
  'facebook_api_key' : '',
  'facebook_secret' : '',
  'tumblr_consumer_key' : '',
  'tumblr_consumer_secret' : '',

  'debug' : 0,
  'port' : 8282,
  'feed_max_days_old' : 30,
  'page_size' : 20,
  'single_user_site' : 0,
  'source' : 'ssh://git@github.com:mimecuvalo/helloworld.git',
  'source_website' : 'http://www.helloworldprogram.com',
  'push_hub' : 'http://pubsubhubbub.appspot.com',

  # Set to 1 on dedicated servers where you can listen on ports
  # Set to 0 on shared servers that have limits and only allow for FCGI
  'ioloop' : 0,
}

dictionary = {
  'reserved_names' : ['admin', 'api', 'auth', 'check_broken_links', 'comments',
      'customize', 'dashboard',
      'data_liberation', 'feed', 'foaf', 'host_meta', 'login', 'logout', 
      'media', 'oembed', 'opensearch', 'page', 'private', 'push', 'remote',
      'remote-comments', 'resource', 'restart', 'salmon', 'search',
      'setup', 'stats', 'themes', 'upload', 'users', 'webfinger'],
  'templates' : ['album', 'archive', 'blank', 'events', 'feed', 'first',
      'forum', 'latest', 'redirect', 'slideshow', 'store',],
  'external_sources': ['twitter', 'facebook', 'google', 'tumblr',],
  'licenses' : {
    'http://creativecommons.org/licenses/by/3.0/':
        { 'name': 'Creative Commons Attribution 3.0 Unported License',
          'html': '<a rel="license" href="http://creativecommons.org/licenses/by/3.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/3.0/88x31.png" /></a>' },
    'http://creativecommons.org/licenses/by-sa/3.0/':
        { 'name': 'Creative Commons Attribution-ShareAlike 3.0 Unported License',
          'html': '<a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/3.0/88x31.png" /></a>' },
    'http://creativecommons.org/licenses/by-nd/3.0/':
        { 'name': 'Creative Commons Attribution-NoDerivs 3.0 Unported License',
          'html': '<a rel="license" href="http://creativecommons.org/licenses/by-nd/3.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nd/3.0/88x31.png" /></a>' },

    'http://creativecommons.org/licenses/by-nc/3.0/':
        { 'name': 'Creative Commons Attribution-NonCommercial 3.0 Unported License',
          'html': '<a rel="license" href="http://creativecommons.org/licenses/by-nc/3.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc/3.0/88x31.png" /></a>' },
    'http://creativecommons.org/licenses/by-nc-sa/3.0/':
       { 'name': 'Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License',
         'html': '<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/3.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/3.0/88x31.png" /></a>' },
    'http://creativecommons.org/licenses/by-nc-nd/3.0/':
        { 'name': 'Creative Commons Attribution-NonCommercial-NoDerivs 3.0 Unported License',
          'html': '<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-nd/3.0/88x31.png" /></a>' },

    'http://purl.org/atompub/license#unspecified':
        { 'name': 'Simple Copyright', 'html': '' },
    'http://www.opensource.org/licenses/mit-license.php':
        { 'name': 'MIT License',
          'html': '<a rel="license" href="http://www.opensource.org/licenses/mit-license.php">MIT Licensed</a>' },
  },

}

dictionary['reserved_names'] += dictionary['external_sources']
