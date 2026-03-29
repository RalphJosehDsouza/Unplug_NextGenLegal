import { DataTypes, Sequelize } from 'sequelize';

import { sequelize } from '../config/db.js';

export const CourtHearing = sequelize.define(
  'CourtHearing',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    lawyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    case_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hearing_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  },
  {
    tableName: 'court_hearings',
    timestamps: false,
  },
);
