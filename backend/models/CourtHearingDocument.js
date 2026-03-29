import { DataTypes, Sequelize } from 'sequelize';

import { sequelize } from '../config/db.js';

export const CourtHearingDocument = sequelize.define(
  'CourtHearingDocument',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    court_hearing_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    required_document_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    document_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  },
  {
    tableName: 'court_hearing_documents',
    timestamps: false,
  },
);
