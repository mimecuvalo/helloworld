const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    dialect: 'mysql',
    database: process.env.REACT_APP_DB_NAME,
    username: process.env.REACT_APP_DB_USERNAME,
    password: process.env.REACT_APP_DB_PASSWORD,
    host: process.env.REACT_APP_DB_HOST,
    port: process.env.REACT_APP_DB_PORT,
    seederStorage: 'sequelize',
  },
  test: {
    dialect: 'mysql',
    database: process.env.REACT_APP_DB_NAME,
    username: process.env.REACT_APP_DB_USERNAME,
    password: process.env.REACT_APP_DB_PASSWORD,
    host: process.env.REACT_APP_DB_HOST,
    port: process.env.REACT_APP_DB_PORT,
    seederStorage: 'sequelize',
  },
  production: {
    dialect: 'mysql',
    database: process.env.REACT_APP_DB_NAME,
    username: process.env.REACT_APP_DB_USERNAME,
    password: process.env.REACT_APP_DB_PASSWORD,
    host: process.env.REACT_APP_DB_HOST,
    port: process.env.REACT_APP_DB_PORT,
    seederStorage: 'sequelize',
  },
};

module.exports = config[env];
