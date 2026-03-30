'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add new columns for WebRTC video calls
      await queryInterface.addColumn(
        'bookings',
        'call_status',
        {
          type: Sequelize.ENUM('pending', 'accepted', 'scheduled', 'active', 'completed', 'rejected'),
          allowNull: true,
          defaultValue: null,
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'bookings',
        'scheduled_call_time',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'bookings',
        'webrtc_room_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
          unique: true,
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'bookings',
        'call_started_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'bookings',
        'call_ended_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('bookings', 'call_status', { transaction });
      await queryInterface.removeColumn('bookings', 'scheduled_call_time', { transaction });
      await queryInterface.removeColumn('bookings', 'webrtc_room_id', { transaction });
      await queryInterface.removeColumn('bookings', 'call_started_at', { transaction });
      await queryInterface.removeColumn('bookings', 'call_ended_at', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
