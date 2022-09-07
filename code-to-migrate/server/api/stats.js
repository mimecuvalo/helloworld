import express from 'express';
import { isRobotViewing } from 'server/util/crawler';
import models from 'server/data/models';
import { parseContentUrl } from 'shared/util/url_factory';
import path from 'path';

const router = express.Router();
router.get('/', async (req, res) => {
  const { username, name } = parseContentUrl(req.query.resource);
  const content = await models.Content.findOne({ where: { username, name } });

  const attributes = isRobotViewing(req) ? { count_robot: content.count_robot + 1 } : { count: content.count + 1 };
  await models.Content.update(attributes, {
    where: {
      username,
      name: content.name,
    },
  });

  res.sendFile(path.resolve(process.cwd(), 'public/img/pixel.gif'));
});

export default router;
