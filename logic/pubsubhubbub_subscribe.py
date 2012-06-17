# The MIT License
#
# Copyright (c) 2009 Adam MacBeth
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

"""A library implementing a PubSubHubbub subscriber, including auto-discovery"""

import urllib
import urllib2


def subscribe_topic(hub_url, topic_url, callback_url, subscribe=True,
              verify="async",
              verify_token="", lease_seconds="", secret=""):
    """ Subscribes to a specified topic url given a known hub url. """

    if subscribe:
        mode ="subscribe"
    else:
        mode = "unsubscribe"

    post_args = {"hub.callback": callback_url,
                 "hub.mode": mode,
                 "hub.topic": topic_url,
                 "hub.verify": verify,
                 "hub.lease_seconds": lease_seconds,
                 "hub.secret": secret,
                 "hub.verify_token": verify_token }
    data = urllib.urlencode(post_args)

    result = 200
    try:
        urllib2.urlopen(hub_url, urllib.urlencode(post_args))
    except urllib2.HTTPError, error:
        result = error.code
        if result < 200 or result >= 300:
            raise error
    return result
