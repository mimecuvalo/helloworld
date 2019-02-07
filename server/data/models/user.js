// Keep in sync with both graphql/schema/user.js and migrations/[date]-create-user.js
export default (sequelize, Sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(191),
        unique: true,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 191],
        },
      },
      name: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: { len: [0, 191] },
      },
      email: {
        type: Sequelize.STRING(191),
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
          notEmpty: true,
          len: [3, 191],
        },
      },
      superuser: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      title: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: { len: [0, 191] },
      },
      description: {
        type: Sequelize.STRING(191),
        validate: { len: [0, 191] },
      },
      hostname: {
        type: Sequelize.STRING(191),
        validate: { len: [0, 191] },
      },
      license: { type: Sequelize.TEXT('medium') },
      google_analytics: {
        type: Sequelize.STRING(191),
        validate: { len: [0, 191] },
      },
      favicon: { type: Sequelize.TEXT('medium') },
      logo: { type: Sequelize.TEXT('medium') },
      theme: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: { len: [1, 191] },
      },
      magic_key: {
        type: Sequelize.TEXT('medium'),
        allowNull: false,
      },
      private_key: {
        type: Sequelize.TEXT('medium'),
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
    }
  );

  return User;
};
