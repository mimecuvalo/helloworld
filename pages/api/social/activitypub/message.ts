import { Activity, createArticle } from 'social-butterfly/activitystreams';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getLocalContent, getLocalUser } from 'social-butterfly/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const content = await getLocalContent(req.query.resource as string);
  const user = await getLocalUser(req.query.resource as string);
  if (!content || !user) {
    return res.status(404).end();
  }

  const json = (await createArticle(req, content, user)).object as Activity;
  // TODO(mime): mistake?
  //json['@context'] = 'https://www.w3.org/ns/activitystreams';
  res.status(200).json(json);
}
