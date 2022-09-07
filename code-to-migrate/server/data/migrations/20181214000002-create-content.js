'use strict';

// Keep in sync with both models/content.js and graphql/schema/content.js
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('Content', {
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
            model: 'User',
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
        template: { type: Sequelize.STRING(191) },
        sort_type: { type: Sequelize.STRING(191) },
        redirect: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        hidden: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        title: {
          type: Sequelize.TEXT('medium'),
          allowNull: false,
        },
        thumb: {
          type: Sequelize.TEXT('medium'),
          allowNull: false,
          defaultValue: '',
        },
        order: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        count: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        count_robot: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        comments_count: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        comments_updated: { type: Sequelize.DATE },
        favorites_count: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        thread: { type: Sequelize.TEXT('medium') },
        thread_user: { type: Sequelize.TEXT('medium') },
        avatar: { type: Sequelize.TEXT('medium') },
        style: {
          type: Sequelize.TEXT('medium'),
          allowNull: false,
          defaultValue: '',
        },
        code: {
          type: Sequelize.TEXT('medium'),
          allowNull: false,
          defaultValue: '',
        },
        view: {
          type: Sequelize.TEXT('medium'),
          allowNull: false,
          defaultValue: '',
        },
        content: {
          type: Sequelize.TEXT('medium'),
          allowNull: false,
          defaultValue: '',
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      })
      .then(() => {
        queryInterface.addIndex('Content', { unique: true, name: 'uri', fields: ['username', 'name'] });
      })
      .then(() => {
        queryInterface.addIndex('Content', { fields: ['section'] });
      })
      .then(() => {
        queryInterface.addIndex('Content', { fields: ['name'] });
      })
      .then(() => {
        queryInterface.addIndex('Content', { fields: ['username'] });
      })
      .then(() => {
        queryInterface.addIndex('Content', { fields: ['album'] });
      })
      .then(() => {
        queryInterface.addIndex('Content', { name: 'search', fields: ['title', 'view'], type: 'fulltext' });
      })
      .then(() => {
        queryInterface.addIndex('Content', { name: 'search2', fields: ['title', 'content'], type: 'fulltext' });
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Content');
  },
};
