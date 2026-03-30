'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add columns to lawyers table
      await queryInterface.addColumn('lawyers', 'razorpay_linked_account_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('lawyers', 'razorpay_stakeholder_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('lawyers', 'bank_account_verified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }, { transaction });

      await queryInterface.addColumn('lawyers', 'payout_balance_paise', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      }, { transaction });

      await queryInterface.addColumn('lawyers', 'commission_rate', {
        type: Sequelize.FLOAT,
        defaultValue: 0.05,
      }, { transaction });

      await queryInterface.addColumn('lawyers', 'total_earned_paise', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      }, { transaction });

      await queryInterface.addColumn('lawyers', 'kyc_status', {
        type: Sequelize.ENUM('pending', 'submitted', 'verified', 'rejected'),
        defaultValue: 'pending',
      }, { transaction });

      // Add columns to bookings table
      await queryInterface.addColumn('bookings', 'razorpay_order_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('bookings', 'razorpay_payment_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('bookings', 'razorpay_transfer_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('bookings', 'platform_commission_paise', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      }, { transaction });

      await queryInterface.addColumn('bookings', 'lawyer_payout_paise', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      }, { transaction });

      await queryInterface.addColumn('bookings', 'payout_status', {
        type: Sequelize.ENUM('pending', 'in_escrow', 'released', 'refunded', 'disputed'),
        defaultValue: 'pending',
      }, { transaction });

      await queryInterface.addColumn('bookings', 'consultation_confirmed_client', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }, { transaction });

      await queryInterface.addColumn('bookings', 'consultation_confirmed_lawyer', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }, { transaction });

      await queryInterface.addColumn('bookings', 'confirmed_at', {
        type: Sequelize.DATE,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('bookings', 'disputed_at', {
        type: Sequelize.DATE,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('bookings', 'dispute_reason', {
        type: Sequelize.TEXT,
        allowNull: true,
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('bookings', 'dispute_reason', { transaction });
      await queryInterface.removeColumn('bookings', 'disputed_at', { transaction });
      await queryInterface.removeColumn('bookings', 'confirmed_at', { transaction });
      await queryInterface.removeColumn('bookings', 'consultation_confirmed_lawyer', { transaction });
      await queryInterface.removeColumn('bookings', 'consultation_confirmed_client', { transaction });
      await queryInterface.removeColumn('bookings', 'payout_status', { transaction });
      await queryInterface.removeColumn('bookings', 'lawyer_payout_paise', { transaction });
      await queryInterface.removeColumn('bookings', 'platform_commission_paise', { transaction });
      await queryInterface.removeColumn('bookings', 'razorpay_transfer_id', { transaction });
      await queryInterface.removeColumn('bookings', 'razorpay_payment_id', { transaction });
      await queryInterface.removeColumn('bookings', 'razorpay_order_id', { transaction });

      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bookings_payout_status";', { transaction });

      await queryInterface.removeColumn('lawyers', 'kyc_status', { transaction });
      await queryInterface.removeColumn('lawyers', 'total_earned_paise', { transaction });
      await queryInterface.removeColumn('lawyers', 'commission_rate', { transaction });
      await queryInterface.removeColumn('lawyers', 'payout_balance_paise', { transaction });
      await queryInterface.removeColumn('lawyers', 'bank_account_verified', { transaction });
      await queryInterface.removeColumn('lawyers', 'razorpay_stakeholder_id', { transaction });
      await queryInterface.removeColumn('lawyers', 'razorpay_linked_account_id', { transaction });

      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_lawyers_kyc_status";', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
