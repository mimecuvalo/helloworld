'use strict';

// Keep in sync with both models/user_remote.js and graphql/schema/user_remote.js
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('User_Remote', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        local_username: {
          type: Sequelize.STRING(191),
          allowNull: false,
        },
        username: {
          type: Sequelize.STRING(191),
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING(191),
          allowNull: false,
        },
        profile_url: {
          type: Sequelize.TEXT('medium'),
          allowNull: false,
        },
        feed_url: {
          type: Sequelize.TEXT('medium'),
          allowNull: false,
        },
        magic_key: { type: Sequelize.TEXT('medium') },
        salmon_url: { type: Sequelize.TEXT('medium') },
        webmention_url: { type: Sequelize.TEXT('medium') },
        hub_url: { type: Sequelize.TEXT('medium') },
        follower: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        following: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        avatar: {
          type: Sequelize.TEXT('medium'),
          allowNull: false,
        },
        favicon: { type: Sequelize.TEXT('medium') },
        order: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        sort_type: { type: Sequelize.STRING(191) },
      })
      .then(() => {
        queryInterface.addIndex('User_Remote', { fields: ['local_username'] });
      })
      .then(() => {
        queryInterface.addIndex('User_Remote', { fields: [{ name: 'profile_url', length: 255 }] });
      })
      .then(() => {
        queryInterface.addIndex('User_Remote', {
          name: 'local_username_2',
          fields: ['local_username', { name: 'profile_url', length: 255 }],
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('User_Remote');
  },
};
