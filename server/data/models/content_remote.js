// Keep in sync with both graphql/schema/content_remote.js and migrations/[date]-create-content-remote.js
export default (sequelize, Sequelize) => {
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
          model: 'users',
          key: 'username',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      local_content_name: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: { len: [0, 191] },
      },
      from_user: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
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
        allowNull: false,
        validate: { len: [0, 191] },
      },
      avatar: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      post_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      link: {
        type: Sequelize.TEXT,
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
        validate: { min: 0 },
      },
      thread: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
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
      },
      read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      is_spam: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      view: {
        type: Sequelize.TEXT('medium'),
        allowNull: false,
      },
    },
    {
      timestamps: false,
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
          name: 'to_username_2',
          fields: ['to_username', 'from_user', { length: 255 }],
        },
        {
          name: 'thread',
          fields: ['thread', { length: 255 }],
        },
      ],
    }
  );

  return Content_Remote;
};
