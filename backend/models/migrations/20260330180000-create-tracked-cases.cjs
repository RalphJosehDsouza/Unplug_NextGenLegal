'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'tracked_cases',
        {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: Sequelize.literal('uuid_generate_v4()'),
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
          },
          cnr: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          case_name: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          last_status: {
            type: Sequelize.STRING(100),
            allowNull: true,
          },
          last_hearing_date: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          last_checked_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('NOW()'),
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('NOW()'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('NOW()'),
          },
        },
        { transaction },
      );

      // Keep a single tracked row per user+cnr.
      await queryInterface.addConstraint('tracked_cases', {
        fields: ['user_id', 'cnr'],
        type: 'unique',
        name: 'tracked_cases_user_id_cnr_unique',
        transaction,
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('tracked_cases', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};

