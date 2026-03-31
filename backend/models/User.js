import { DataTypes, Sequelize } from 'sequelize';

import { sequelize } from '../config/db.js';

export const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: true, // Can be null for OAuth-only accounts.
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('citizen', 'lawyer', 'admin'),
      allowNull: false,
    },
    preferred_lang: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'en',
    },
    aadhaar_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    google_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subscription_tier: {
      type: DataTypes.ENUM('free', 'starter', 'professional', 'business'),
      allowNull: false,
      defaultValue: 'business', // Default to business so nothing is locked for demo
    },
    subscription_billing: {
      type: DataTypes.ENUM('monthly', 'yearly'),
      allowNull: false,
      defaultValue: 'monthly',
    },
    subscription_started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    subscription_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    documents_generated_this_month: {
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
    tableName: 'users',
    timestamps: false,
  },
);

