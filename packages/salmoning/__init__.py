#!/usr/bin/python2.4
#
# Copyright 2010 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""Support library for the Salmon Protocol.

See Salmon I-D for specification.  This module
implements a support library for Salmon on top of the
Magic Envelope library and other bits.
"""

__author__ = 'jpanzer@google.com (John Panzer)'


#import base64
#import xml.dom.minidom as dom

import magicsig


class SalmonProtocol(object):
  """Implementation of Salmon Protocol."""

  magicenv = magicsig.MagicEnvelopeProtocol()

  def _GetKeypair(self, signer_uri):
    return self.key_retriever.LookupPublicKey(signer_uri)

  def SignSalmon(self, text, mimetype, requestor_id):
    """Signs a Salmon on behalfo the the current_user.

    Input text must be in a recognized format so authorship can be
    verified.

    Args:
      text: Text of message to be signed.
      mimetype: The MIME type of the message to sign.
      requestor_id: The id of the requestor (usually current logged in user).
    Returns:
      The Magic Envelope parameters from section 3.1 of the
      Magic Signatures spec, as a dict.
    """
    
    assert mimetype == 'application/atom+xml'

    requestor_id = magicsig.NormalizeUserIdToUri(requestor_id)

    if not self.magicenv.IsAllowedSigner(text, 
        magicsig.NormalizeUserIdToUri(requestor_id)):
        # TODO: Fix authorship if missing author, raise
        # exception otherwise.
        return

    env = magicsig.Envelope(
        self.magicenv,
        raw_data_to_sign=text,
        signer_uri=requestor_id,
        signer_key=self._GetKeypair(requestor_id),
        data_type='application/atom+xml',
        encoding='base64url',
        alg='RSA-SHA256')


    return env.ToXML()

  def ParseSalmon(self, text, mimetype):
    """Parses a salmon from text with given mimetype.

    Returns:
      The salmon data as a dict, with fields:
    """

    self.magicenv.key_retriever = self.key_retriever

    return magicsig.Envelope(
       self.magicenv,
       mime_type=mimetype,
       document=text).ToAtom()
