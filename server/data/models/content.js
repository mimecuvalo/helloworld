// Keep in sync with both graphql/schema/content.js and migrations/[date]-create-content.js
export default (sequelize, Sequelize) => {
  const Content = sequelize.define(
    'Content',
    {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      username: {
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
      section: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 191],
        },
      },
      album: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: {
          len: [0, 191],
        },
      },
      name: {
        type: Sequelize.STRING(191),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 191],
        },
      },
      template: {
        type: Sequelize.STRING(191),
        validate: { len: [0, 191] },
      },
      sort_type: {
        type: Sequelize.STRING(191),
        validate: { len: [0, 191] },
      },
      redirect: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { min: 0 },
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
      date_created: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      date_updated: {
        type: Sequelize.DATE,
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
        validate: { min: 0 },
        defaultValue: 0,
      },
      count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { min: 0 },
        defaultValue: 0,
      },
      count_robot: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { min: 0 },
        defaultValue: 0,
      },
      comments_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { min: 0 },
        defaultValue: 0,
      },
      comments_updated: { type: Sequelize.DATE },
      favorited: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    },
    {
      timestamps: false,
      freezeTableName: true,
      indexes: [
        {
          name: 'uri',
          fields: ['username', 'name'],
        },
        {
          name: 'section',
          fields: ['section'],
        },
        {
          name: 'name',
          fields: ['name'],
        },
        {
          name: 'user',
          fields: ['username'],
        },
        {
          name: 'album',
          fields: ['album'],
        },
      ],
    }
  );

  return Content;
};
