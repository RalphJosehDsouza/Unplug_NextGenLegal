import { DataTypes, Sequelize } from 'sequelize';

import { sequelize } from '../config/db.js';

const docTypes = [
  'nda',
  'rental_agreement',
  'partnership_deed',
  'employment_contract',
  'affidavit',
  'power_of_attorney',
  'legal_notice',
  'rti_application',
  'pwdva_application',
  'uploaded_pdf',
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
    source_type: {
      type: DataTypes.ENUM('generated', 'uploaded'),
      allowNull: false,
      defaultValue: 'generated',
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'application/pdf',
    },
    file_size_bytes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    uploader_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    viewer_policy: {
      type: DataTypes.ENUM('view_only', 'download_allowed'),
      allowNull: false,
      defaultValue: 'view_only',
    },
    share_scope: {
      type: DataTypes.ENUM('owner_only', 'all_lawyers'),
      allowNull: false,
      defaultValue: 'owner_only',
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
    signature_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    signed_expired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    estamped: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    estamp_certificate: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    stamp_duty_paise: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stamp_article_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    stamp_act_reference: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    stamp_state: {
      type: DataTypes.STRING(10),
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

