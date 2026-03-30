import { DataTypes, Sequelize } from 'sequelize';

import { sequelize } from '../config/db.js';

export const Lawyer = sequelize.define(
  'Lawyer',
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
    bar_council_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    specialization: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: [],
    },
    languages: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: [],
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rate_per_hour: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    calendly_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Used by the slot picker to generate available consultation times.
    working_hours: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    // Proof document uploaded during lawyer registration.
    bar_council_image_s3_key: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    razorpay_linked_account_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    razorpay_fund_account_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    razorpay_stakeholder_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bank_account_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    payout_balance_paise: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    commission_rate: {
      type: DataTypes.FLOAT,
      defaultValue: 0.05,
    },
    total_earned_paise: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    kyc_status: {
      type: DataTypes.ENUM('pending', 'submitted', 'verified', 'rejected'),
      defaultValue: 'pending',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  },
  {
    tableName: 'lawyers',
    timestamps: false,
  },
);

