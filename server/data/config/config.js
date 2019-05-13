const env = process.env.NODE_ENV || 'development';

const config = {};
config[env] = {
  dialect: 'mysql',
  database: process.env.REACT_APP_DB_NAME,
  username: process.env.REACT_APP_DB_USERNAME,
  password: process.env.REACT_APP_DB_PASSWORD,
  host: process.env.REACT_APP_DB_HOST,
};

module.exports = config;
