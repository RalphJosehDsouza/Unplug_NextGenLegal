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
    razorpay_order_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    razorpay_payment_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    razorpay_transfer_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    platform_commission_paise: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lawyer_payout_paise: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    payout_status: {
      type: DataTypes.ENUM('pending', 'in_escrow', 'released', 'refunded', 'disputed'),
      defaultValue: 'pending',
    },
    consultation_confirmed_client: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    consultation_confirmed_lawyer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    disputed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dispute_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
    // WebRTC video call fields
    call_status: {
      type: DataTypes.ENUM('pending', 'accepted', 'scheduled', 'active', 'completed', 'rejected'),
      allowNull: true,
      defaultValue: null,
    },
    scheduled_call_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    webrtc_room_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    call_started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    call_ended_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'bookings',
    timestamps: false,
  },
);

