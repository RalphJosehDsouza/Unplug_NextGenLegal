'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the enum type first
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_subscription_tier') THEN
          CREATE TYPE "enum_users_subscription_tier" AS ENUM ('free', 'basic', 'pro', 'premium');
        END IF;
      END
      $$;
    `);

    // Add the column with default 'premium' so all existing & new users have full access for demo
    await queryInterface.addColumn('users', 'subscription_tier', {
      type: Sequelize.ENUM('free', 'basic', 'pro', 'premium'),
      allowNull: false,
      defaultValue: 'premium',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'subscription_tier');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_subscription_tier";');
  },
};
