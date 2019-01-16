// Keep in sync with both graphql/schema/user_remote.js and migrations/[date]-create-user-remote.js
export default (sequelize, Sequelize) => {
  const User_Remote = sequelize.define(
    'Users_Remote',
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
      magic_key: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      profile_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      salmon_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      webmention_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      feed_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      hub_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      follower: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      following: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      avatar: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      favicon: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      order: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { min: 0 },
      },
      sort_type: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: {
          len: [0, 191],
        },
      },
    },
    {
      timestamps: false,
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
