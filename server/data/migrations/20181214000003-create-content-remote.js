'use strict';

// Keep in sync with both models/user.js and graphql/schema/content_remote.js
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable(
        'Content_Remote',
        {
          id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          to_username: {
            type: Sequelize.STRING(191),
            allowNull: false,
            references: {
              model: 'users',
              key: 'username',
            },
            onUpdate: 'cascade',
            onDelete: 'cascade',
          },
          local_content_name: { type: Sequelize.STRING(191) },
          from_user: {
            type: Sequelize.TEXT('medium'),
            allowNull: false,
          },
          username: {
            type: Sequelize.STRING(191),
            allowNull: false,
          },
          creator: { type: Sequelize.STRING(191) },
          avatar: { type: Sequelize.TEXT('medium') },
          title: {
            type: Sequelize.TEXT('medium'),
            allowNull: false,
          },
          post_id: {
            type: Sequelize.TEXT('medium'),
            allowNull: false,
          },
          link: {
            type: Sequelize.TEXT('medium'),
            allowNull: false,
          },
          date_created: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          date_updated: {
            type: Sequelize.DATE,
          },
          comments_updated: {
            type: Sequelize.DATE,
          },
          comments_count: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
          },
          thread: { type: Sequelize.TEXT('medium') },
          type: {
            type: Sequelize.STRING(191),
            allowNull: false,
          },
          favorited: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          read: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          is_spam: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          deleted: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          view: {
            type: Sequelize.TEXT('medium'),
            allowNull: false,
          },
        },
        {
          indexes: [
            {
              name: 'to_username',
              fields: ['to_username'],
            },
            {
              name: 'from_user',
              fields: ['from_user', { length: 255 }],
            },
            {
              name: 'to_username_2',
              fields: ['to_username', 'from_user', { length: 255 }],
            },
            {
              name: 'thread',
              fields: ['thread', { length: 255 }],
            },
          ],
        }
      )
      .then(() => {
        queryInterface.addIndex('Content_Remote', { fields: ['to_username'] });
      })
      .then(() => {
        queryInterface.addIndex('Content_Remote', { fields: [{ name: 'from_user', length: 255 }] });
      })
      .then(() => {
        queryInterface.addIndex('Content_Remote', { fields: [{ name: 'thread', length: 255 }] });
      })
      .then(() => {
        queryInterface.addIndex('Content_Remote', {
          name: 'to_username_2',
          fields: ['to_username', { name: 'from_user', length: 255 }],
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Content_Remote');
  },
};
