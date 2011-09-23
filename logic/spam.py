from reverend.thomas import Bayes

SPAM_DB = 'spam.bayes'
guesser = Bayes()

# load the spam DB
try:
    guesser.load(SPAM_DB)
except IOError:
    print "Creating a new spam filter database"
    guesser.save(SPAM_DB)

def train_spam(text):
    guesser.train('spam', text)
    guesser.save(SPAM_DB)

def train_ham(text):
    guesser.train('ham', text)
    guesser.save(SPAM_DB)

# try to guess the spam / ham ratio of a text
def guess(text):
    guesser.load(SPAM_DB)

    spam = 0
    ham = 0
    value = guesser.guess(text)
    for o in value:
        if o[0] == 'ham': ham = o[1]
        if o[0] == 'spam': spam = o[1]
    return spam > ham
