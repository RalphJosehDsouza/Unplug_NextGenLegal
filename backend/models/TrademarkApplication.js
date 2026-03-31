import { DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../config/db.js';

export const TrademarkApplication = sequelize.define(
  'TrademarkApplication',
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
    mark_type: {
      type: DataTypes.ENUM('word', 'device', 'combined', 'sound'),
      allowNull: false,
    },
    trademark_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    trademark_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nice_classes: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    applicant_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    applicant_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    applicant_type: {
      type: DataTypes.ENUM('individual', 'startup', 'small_enterprise', 'large_enterprise'),
      allowNull: false,
      defaultValue: 'individual',
    },
    status: {
      type: DataTypes.ENUM('draft', 'conflict_checked', 'documents_generated', 'sent_to_lawyer'),
      allowNull: false,
      defaultValue: 'draft',
    },
    conflict_report: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    generated_documents: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    tableName: 'trademark_applications',
    timestamps: true,
    underscored: true,
  },
);
