'use strict';

// Keep in sync with both models/user.js and graphql/schema/user.js
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('User', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(191),
        unique: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(191),
        unique: true,
        allowNull: false,
      },
      superuser: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      description: { type: Sequelize.STRING(191) },
      hostname: { type: Sequelize.STRING(191) },
      license: { type: Sequelize.TEXT('medium') },
      google_analytics: { type: Sequelize.STRING(191) },
      favicon: { type: Sequelize.TEXT('medium') },
      logo: { type: Sequelize.TEXT('medium') },
      theme: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      magic_key: {
        type: Sequelize.TEXT('medium'),
        allowNull: false,
      },
      private_key: {
        type: Sequelize.TEXT('medium'),
        allowNull: false,
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('User');
  },
};
