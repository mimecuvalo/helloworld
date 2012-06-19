from autumn.db.query import Query

def search(profile, query, begin, page_size):
  return Query.sql(
      """SELECT *,
      (( length(title + view)
           - length(replace(title + view, %s, '')) )
           / length(%s) )
           /(length(title + view) + 1
           - length(replace(title + view, ' ', '')) )
           as ratio_of_keyword_occurence_to_other_words
         FROM `content`
         WHERE `username` = %s
           AND hidden = 0
           AND (`title` REGEXP %s
           OR  `view` REGEXP %s)
           ORDER BY ratio_of_keyword_occurence_to_other_words DESC
           LIMIT %s, %s""",
           (query, query, profile,
            '[[:<:]]' + query + '[[:>:]]', '[[:<:]]' + query + '[[:>:]]',
            begin, page_size))

# this will work for now...
def dashboard_feed(profile, begin, page_size, sort_type, read_all_mode,
    specific_feed, just_local_feed, local_entry=None, remote_entry=None,
    spam=False, favorite=False, comments=False, external=None, query=None,
    from_local_date=None, from_remote_date=None):
  content_local_restrict = ""
  content_remote_restrict = ""
  parameters = [profile, profile]
  just_remote_feed = False

  sort_query = 'DESC'
  if sort_type == 'oldest':
    sort_query = 'ASC'

  if specific_feed:
    content_remote_restrict += """ AND `from_user` = %s """
    parameters.append(specific_feed)
  if local_entry:
    content_local_restrict += """ AND `id` = %s """
    parameters.append(local_entry)
  if remote_entry:
    content_remote_restrict += """ AND `id` = %s """
    parameters.append(remote_entry)
  elif begin != 0:
    # TODO should also limit lower limit when sorting by newest
    comparison = '>=' if sort_type == 'oldest' else '<='
    if from_local_date:
      content_local_restrict += (""" AND `date_created` """ +
          comparison + """ %s """)
      parameters.append(from_local_date)
    if from_remote_date:
      content_remote_restrict += (""" AND `date_created` """ +
          comparison + """ %s """)
      parameters.append(from_remote_date)
  elif (not spam and not favorite and not comments and not query
      and read_all_mode == 0):
    content_remote_restrict += """ AND `read` = 0 """
  if spam:
    just_remote_feed = True
    content_remote_restrict += """ AND `is_spam` = 1 """
  if favorite:
    just_remote_feed = True
    content_remote_restrict += """ AND `favorited` = 1 """
  if external:
    just_remote_feed = True
    content_remote_restrict += """ AND `type` = %s """
    parameters.append(external)
  if comments:
    just_remote_feed = True
    content_remote_restrict += """ AND `type` = %s """
    parameters.append('comment')
  elif (not just_local_feed and not local_entry and not remote_entry
      and not external
      and not favorite and not spam and not comments and not query):
    content_remote_restrict += """ AND `type` = %s """
    parameters.append('post')
  if query:
    just_remote_feed = True
    content_remote_restrict += """ AND (`title` LIKE %s or `view` LIKE %s)"""
    parameters.append('%' + query + '%')
    parameters.append('%' + query + '%')
  parameters += [begin, page_size]

  local_query = """
         (SELECT `id`, `username`, `title`, `view`, `date_created`,
          `favorited`, `is_spam`, `deleted`,
          `count`, `count_robot`, `date_updated`, `hidden`, `date_start`,
          `date_end`, `date_repeats`, `section`, `album`, `name`, `thumb`,
          `thread`,
          '' as `to_username`, '' as `creator`, '' as `type`,
          '' as `from_user`, '' as `post_id`, '' as `link`, 0 as `read`,
          `comments_count`, '' as `avatar`
          FROM `content`
          WHERE `username` = %s """ \
      +      content_local_restrict \
      +  """ AND `redirect` = 0
             AND `section` != 'comments'
          ORDER BY date_created """ + sort_query + """)"""

  remote_query = """
          (SELECT `id`, `username`, `title`, `view`, `date_created`,
           `favorited`, `is_spam`, `deleted`,
           0 as `count`, 0 as `count_robot`, `date_updated`, 0 as `hidden`,
           now() as `date_start`, now() as `date_end`, 0 as `date_repeats`,
           '' as `section`, '' as `album`, '' as `name`, '' as `thumb`,
           '' as `thread`,
           `to_username`, `creator`, `type`, `from_user`, `post_id`, `link`,
           `read`, `comments_count`, `avatar`
           FROM `content_remote`
           WHERE `to_username` = %s """ \
      +      content_remote_restrict \
      +  """ AND `is_spam` = 0
             AND `deleted` = 0
           ORDER BY date_created """ + sort_query + """)
           ORDER BY date_created """ + sort_query

  limit_fragment = """ LIMIT %s, %s """

  if not just_remote_feed and (just_local_feed or local_entry):
    parameters.pop(0)  # remove first profile
    return Query.sql(local_query + limit_fragment, parameters)

  if just_remote_feed or specific_feed or remote_entry:
    parameters.pop(0)  # remove first profile
    return Query.sql(remote_query + limit_fragment, parameters)

  return Query.sql(local_query + """ UNION """ + remote_query + limit_fragment,
      parameters)
