// Keep in sync with both graphql/schema/user_remote.js and migrations/[date]-create-user-remote.js
export default (sequelize, Sequelize) => {
  const User_Remote = sequelize.define(
    'User_Remote',
    {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      local_username: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 191],
        },
      },
      username: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 191],
        },
      },
      name: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: {
          len: [0, 191],
        },
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
        validate: { min: 0 },
        defaultValue: 0,
      },
      sort_type: {
        type: Sequelize.STRING(191),
        validate: {
          len: [0, 191],
        },
      },
    },
    {
      freezeTableName: true,
      indexes: [
        {
          name: 'local_username',
          fields: ['local_username'],
        },
        {
          name: 'profile_url',
          fields: ['profile_url', { length: 255 }],
        },
        {
          name: 'local_username_2',
          fields: ['local_username', 'profile_url', { length: 255 }],
        },
      ],
    }
  );

  return User_Remote;
};
