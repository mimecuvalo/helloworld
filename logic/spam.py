import os

from reverend.thomas import Bayes

def get_db(private_path, username):
  path = os.path.join(os.path.join(private_path, username), 'spam.bayes')
  guesser = Bayes()

  # load the spam DB
  try:
      guesser.load(path)
  except IOError:
      print "Creating a new spam filter database"
      guesser.save(path)

  return guesser, path

def train_spam(text, private_path, username):
  guesser, path = get_db(private_path, username)
  guesser.train('spam', text)
  guesser.save(path)

def train_ham(text, private_path, username):
  guesser, path = get_db(private_path, username)
  guesser.train('ham', text)
  guesser.save(path)

# try to guess the spam / ham ratio of a text
def guess(text, private_path, username):
  guesser, path = get_db(private_path, username)
  guesser.load(path)

  spam = 0
  ham = 0
  value = guesser.guess(text)
  for o in value:
    if o[0] == 'ham': ham = o[1]
    if o[0] == 'spam': spam = o[1]
  return spam > ham
