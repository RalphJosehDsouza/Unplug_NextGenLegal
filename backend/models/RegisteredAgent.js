import { DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../config/db.js';

export const RegisteredAgent = sequelize.define(
  'RegisteredAgent',
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
    business_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    registration_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    registered_state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    agent_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notifications_email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'inactive'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'registered_agents',
    timestamps: true,
    underscored: true,
  },
);
