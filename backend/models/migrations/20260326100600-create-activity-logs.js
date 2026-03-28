export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('activity_logs', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    action: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    resource_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    resource_id: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    ip_address: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('activity_logs');
}

export default { up, down };

