import os, sys

INTERP = "/usr/bin/python"
if sys.executable != INTERP: os.execl(INTERP, INTERP, *sys.argv)

sys.path.append(os.path.dirname(os.path.realpath(__file__)))

from helloworld import application
