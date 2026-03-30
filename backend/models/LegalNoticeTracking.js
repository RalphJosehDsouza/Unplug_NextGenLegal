import { DataTypes, Sequelize } from 'sequelize';

import { sequelize } from '../config/db.js';

export const LegalNoticeTracking = sequelize.define(
  'LegalNoticeTracking',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    document_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tracking_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    sent_via: {
      type: DataTypes.ENUM('registered_post', 'email', 'both'),
      allowNull: false,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    response_deadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    response_received: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'legal_notice_trackings',
    timestamps: false,
  },
);

