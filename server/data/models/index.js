import content from './content';
import contentRemote from './content_remote';
import Sequelize from 'sequelize';
import user from './user';
import userRemote from './user_remote';

export const sequelize = new Sequelize({
  dialect: 'mysql',
  database: process.env.REACT_APP_DB_NAME,
  username: process.env.REACT_APP_DB_USERNAME,
  password: process.env.REACT_APP_DB_PASSWORD,
  host: process.env.REACT_APP_DB_HOST,
  operatorsAliases: false,
  logging: false,
});

export const Content = content(sequelize, Sequelize);
export const Content_Remote = contentRemote(sequelize, Sequelize);
export const User = user(sequelize, Sequelize);
export const User_Remote = userRemote(sequelize, Sequelize);

export default {
  Content,
  Content_Remote,
  User,
  User_Remote,
};
