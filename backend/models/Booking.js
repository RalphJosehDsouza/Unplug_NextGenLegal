import { DataTypes, Sequelize } from 'sequelize';

import { sequelize } from '../config/db.js';

const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

export const Booking = sequelize.define(
  'Booking',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    lawyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    slot_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    duration_mins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
    },
    status: {
      type: DataTypes.ENUM(...statuses),
      allowNull: false,
      defaultValue: 'pending',
    },
    meeting_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount_paise: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  },
  {
    tableName: 'bookings',
    timestamps: false,
  },
);

