'use strict';

// Keep in sync with both models/user.js and graphql/user/user.js
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(191),
        unique: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(191),
        unique: true,
        allowNull: false,
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('users');
  },
};
