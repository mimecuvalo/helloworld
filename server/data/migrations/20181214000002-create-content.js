'use strict';

// Keep in sync with both models/content.js and graphql/schema/content.js
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('content', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(191),
        allowNull: false,
        references: {
          model: 'users',
          key: 'username',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      section: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      album: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      template: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      sort_type: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      redirect: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      hidden: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      date_created: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      date_updated: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      thumb: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      order: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      count_robot: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      comments_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      comments_updated: {
        type: Sequelize.DATE,
      },
      favorited: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      thread: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      thread_user: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      avatar: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      style: {
        type: Sequelize.TEXT('medium'),
        allowNull: false,
      },
      code: {
        type: Sequelize.TEXT('medium'),
        allowNull: false,
      },
      view: {
        type: Sequelize.TEXT('medium'),
        allowNull: false,
      },
    })
    .then(() => { queryInterface.addIndex('content', { name: 'uri', fields: ['username', 'name'] }) })
    .then(() => { queryInterface.addIndex('content', { fields: ['section'] }) })
    .then(() => { queryInterface.addIndex('content', { fields: ['name'] }) })
    .then(() => { queryInterface.addIndex('content', { fields: ['username'] }) })
    .then(() => { queryInterface.addIndex('content', { fields: ['album'] }) });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('content');
  },
};
