import { DataTypes, Sequelize } from 'sequelize';

import { sequelize } from '../config/db.js';

const docTypes = [
  'nda',
  'rental_agreement',
  'partnership_deed',
  'employment_contract',
  'affidavit',
  'power_of_attorney',
];

export const Document = sequelize.define(
  'Document',
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
    doc_type: {
      type: DataTypes.ENUM(...docTypes),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    s3_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    encryption_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    signed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    signed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  },
  {
    tableName: 'documents',
    timestamps: false,
  },
);

