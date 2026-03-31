import { DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../config/db.js';

export const EnterpriseLead = sequelize.define(
  'EnterpriseLead',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contact_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    employee_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'demo_scheduled', 'closed'),
      allowNull: false,
      defaultValue: 'new',
    },
  },
  {
    tableName: 'enterprise_leads',
    timestamps: true,
    underscored: true,
  },
);
