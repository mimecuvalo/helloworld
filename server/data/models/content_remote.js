// Keep in sync with both graphql/schema/content_remote.js and migrations/[date]-create-content-remote.js
export default function ContentRemote(sequelize, Sequelize) {
  const Content_Remote = sequelize.define(
    'Content_Remote',
    {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      to_username: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 191],
        },
        references: {
          model: 'User',
          key: 'username',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      local_content_name: {
        type: Sequelize.STRING(191),
        validate: { len: [0, 191] },
      },
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
        validate: {
          notEmpty: true,
          len: [1, 191],
        },
      },
      creator: {
        type: Sequelize.STRING(191),
        validate: { len: [0, 191] },
      },
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
      comments_updated: {
        type: Sequelize.DATE,
      },
      comments_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { min: 0 },
        defaultValue: 0,
      },
      thread: { type: Sequelize.TEXT('medium') },
      type: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 191],
        },
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
    },
    {
      freezeTableName: true,
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
          name: 'comment_user',
          fields: ['comment_user', { length: 255 }],
        },
        {
          name: 'to_username_2',
          fields: ['to_username', 'from_user', { length: 255 }],
        },
        {
          name: 'to_username_3',
          fields: ['to_username', 'comment_user', { length: 255 }],
        },
        {
          unique: true,
          name: 'content_per_user',
          fields: ['to_username', 'post_id', { length: 255 }],
        },
        {
          name: 'thread',
          fields: ['thread', { length: 255 }],
        },
        {
          name: 'search',
          fields: ['title', 'view'],
          type: 'fulltext',
        },
      ],
    }
  );

  return Content_Remote;
};
