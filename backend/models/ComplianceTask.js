import { DataTypes, Sequelize } from 'sequelize';

import { sequelize } from '../config/db.js';

const statuses = ['pending', 'notified', 'completed', 'overdue'];

export const ComplianceTask = sequelize.define(
  'ComplianceTask',
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
    task_type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...statuses),
      allowNull: false,
      defaultValue: 'pending',
    },
    notified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    external_ref: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  },
  {
    tableName: 'compliance_tasks',
    timestamps: false,
  },
);

