from autumn.db.query import Query

def search(profile, query):
  return Query.sql("""SELECT * FROM `content`
                        WHERE `username` = %s
                          AND hidden = 0
                          AND (`title` LIKE %s
                          OR  `view` LIKE %s)
                          LIMIT 10""",
                          (profile, '%' + query + '%', '%' + query + '%'))
