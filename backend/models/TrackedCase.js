import { DataTypes, Sequelize } from 'sequelize';

import { sequelize } from '../config/db.js';

export const TrackedCase = sequelize.define(
  'TrackedCase',
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
    cnr: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    case_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    last_status: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_hearing_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_checked_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  },
  {
    tableName: 'tracked_cases',
    timestamps: false,
  },
);

