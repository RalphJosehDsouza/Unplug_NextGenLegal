import { DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../config/db.js';

export const BusinessRegistration = sequelize.define(
  'BusinessRegistration',
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
    entity_type: {
      type: DataTypes.ENUM('private_limited', 'llp', 'opc', 'partnership', 'sole_proprietorship', 'section_8', 'producer_company'),
      allowNull: false,
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    registered_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    directors: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    authorized_capital: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    paid_up_capital: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    main_objects: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'documents_generated', 'sent_to_lawyer'),
      allowNull: false,
      defaultValue: 'draft',
    },
    generated_documents: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    tableName: 'business_registrations',
    timestamps: true,
    underscored: true,
  },
);
