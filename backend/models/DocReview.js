import { DataTypes, Sequelize } from 'sequelize';

import { sequelize } from '../config/db.js';

export const DocReview = sequelize.define(
  'DocReview',
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
    filename: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    risk_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    analysis_json: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    lawyer_specialization_needed: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  },
  {
    tableName: 'doc_reviews',
    timestamps: false,
  },
);

