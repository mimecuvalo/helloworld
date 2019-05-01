'use strict';

// Keep in sync with both models/user.js and graphql/schema/content_remote.js
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('Content_Remote', {
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
            model: 'User',
            key: 'username',
          },
          onUpdate: 'cascade',
          onDelete: 'cascade',
        },
        local_content_name: { type: Sequelize.STRING(191) },
        from_user: { type: Sequelize.TEXT('medium') },
        from_user_remote_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          references: {
            model: 'User_Remote',
            key: 'id',
          },
          onUpdate: 'cascade',
          onDelete: 'cascade',
        },
        comment_user: { type: Sequelize.TEXT('medium') },
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
        content: {
          type: Sequelize.TEXT('medium'),
          allowNull: false,
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      })
      .then(() => {
        queryInterface.addIndex('Content_Remote', { fields: ['to_username'] });
      })
      .then(() => {
        queryInterface.addIndex('Content_Remote', { fields: [{ name: 'from_user', length: 255 }] });
      })
      .then(() => {
        queryInterface.addIndex('Content_Remote', { fields: [{ name: 'comment_user', length: 255 }] });
      })
      .then(() => {
        queryInterface.addIndex('Content_Remote', { fields: [{ name: 'thread', length: 255 }] });
      })
      .then(() => {
        queryInterface.addIndex('Content_Remote', {
          name: 'to_username_2',
          fields: ['to_username', { name: 'from_user', length: 255 }],
        });
      })
      .then(() => {
        queryInterface.addIndex('Content_Remote', {
          name: 'to_username_3',
          fields: ['to_username', { name: 'comment_user', length: 255 }],
        });
      })
      .then(() => {
        queryInterface.addIndex('Content_Remote', {
          name: 'content_per_user',
          fields: ['to_username', { name: 'post_id', length: 255 }],
        });
      })
      .then(() => {
        queryInterface.addIndex('Content_Remote', { name: 'search', fields: ['title', 'view'], type: 'fulltext' });
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Content_Remote');
  },
};
