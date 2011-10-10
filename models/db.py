from autumn.db.query import Query

def search(profile, query):
  return Query.sql("""SELECT * FROM `content`
                        WHERE `username` = %s
                          AND hidden = 0
                          AND (`title` LIKE %s
                          OR  `view` LIKE %s)
                          LIMIT 10""",
                          (profile, '%' + query + '%', '%' + query + '%'))

# this will work for now...
def dashboard_feed(profile, begin, end):
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
                          (profile, profile, begin, end))
