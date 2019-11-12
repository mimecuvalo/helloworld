'use strict';

const USERS = [{}];

// TODO(mime): create an initial admin user and make it the first person who logs into the site.
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('User', USERS, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('User', null, {});
  },
};
