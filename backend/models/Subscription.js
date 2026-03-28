import { DataTypes, Sequelize } from 'sequelize';

import { sequelize } from '../config/db.js';

const plans = ['freemium', 'starter', 'pro', 'enterprise'];

export const Subscription = sequelize.define(
  'Subscription',
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
    plan: {
      type: DataTypes.ENUM(...plans),
      allowNull: false,
      defaultValue: 'freemium',
    },
    razorpay_sub_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    starts_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'subscriptions',
    timestamps: false,
  },
);

