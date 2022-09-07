import fs from 'fs';
import models from 'server/data/models';

export default async function dataLiberation(req, res) {
  const username = req.session.user.model.username;

  const data = {
    content: await models.Content.findAll({ where: { username } }),
    contentRemote: await models.Content_Remote.findAll({ where: { to_username: username } }),
    user: await models.User.findOne({ where: { username } }),
    userRemote: await models.User_Remote.findAll({ where: { local_username: username } }),
  };

  const filename = `/tmp/helloworld-${username}-data-liberation.json`;

  // `id` field purged for security sake so users don't get primary keys.
  // this is a cheapo way of doing this.
  const stringifiedAndIdPurged = JSON.stringify(data, undefined, 2).replace(/ +"id":.+\n/g, '');

  fs.writeFileSync(filename, stringifiedAndIdPurged);
  res.download(filename);
}
