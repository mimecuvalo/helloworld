from autumn.db.query import Query

def search(profile, query, begin, page_size):
  return Query.sql("""SELECT *,
                      (( length(title + view)
                           - length(replace(title + view, %s, '')) )
                           / length(%s) )
                           /(length(title + view) + 1
                           - length(replace(title + view, ' ', '')) ) as ratio_of_keyword_occurence_to_other_words
                        FROM `content`
                        WHERE `username` = %s
                          AND hidden = 0
                          AND (`title` REGEXP %s
                          OR  `view` REGEXP %s)
                          ORDER BY ratio_of_keyword_occurence_to_other_words DESC
                          LIMIT %s, %s""",
                          (query, query, profile, '[[:<:]]' + query + '[[:>:]]', '[[:<:]]' + query + '[[:>:]]',  begin, page_size))

# this will work for now...
def dashboard_feed(profile, begin, page_size):
  return Query.sql("""(SELECT `id`, `username`, `title`, `view`, `date_created`, `favorited`, `is_spam`, `deleted`,
                              `count`, `date_updated`, `hidden`, `date_start`, `date_end`, `date_repeats`, `section`, `name`, `thumb`,
                              '' as `creator`, '' as `type`, '' as `from_user`, '' as `post_id`, '' as `link`
                         FROM `content`
                         WHERE `username` = %s
                           AND `redirect` = 0
                           AND `section` != 'comments')
                         UNION
                      (SELECT `id`, `username`, `title`, `view`, `date_created`, `favorited`, `is_spam`, `deleted`,
                              0 as `count`, now() as `date_updated`, 0 as `hidden`, now() as `date_start`, now() as `date_end`, 0 as `date_repeats`, '' as `section`, '' as `name`, '' as `thumb`,
                              `creator`, `type`, `from_user`, `post_id`, `link`
                         FROM `content_remote`
                         WHERE `to_username` = %s
                           AND `is_spam` = 0
                           AND `deleted` = 0)
                       ORDER BY date_created DESC
                       LIMIT %s,%s""",
                          (profile, profile, begin, page_size))
