export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('compliance_tasks', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    task_type: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    label: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    due_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('pending', 'notified', 'completed', 'overdue'),
      allowNull: false,
      defaultValue: 'pending',
    },
    notified_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    external_ref: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('compliance_tasks');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_compliance_tasks_status";');
}

export default { up, down };

