import { NextApiRequest, NextApiResponse } from 'next';

import fs from 'fs';
import getConfig from 'next/config';
import { isRobotViewing } from 'util/crawler';
import { parseContentUrl } from 'util/url-factory';
import path from 'path';
import prisma from 'data/prisma';

const { serverRuntimeConfig } = getConfig();

const filePath = path.join(serverRuntimeConfig.PROJECT_ROOT, 'public/img/pixel.gif');
const pixelImageBuffer = fs.readFileSync(filePath);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, name } = parseContentUrl(req.query['resource'] as string);
  const content = await prisma?.content.findUnique({ where: { username_name: { username, name } } });

  if (!content) {
    res.status(404).json({ statusCode: 404, message: 'not found' });
    return;
  }

  const attributes = isRobotViewing(req) ? { count_robot: content.countRobot + 1 } : { count: content.count + 1 };
  await prisma?.content.update({
    data: attributes,
    where: {
      username_name: {
        username,
        name: content.name,
      },
    },
  });

  res.setHeader('Content-Type', 'image/gif');
  res.send(pixelImageBuffer);
}
