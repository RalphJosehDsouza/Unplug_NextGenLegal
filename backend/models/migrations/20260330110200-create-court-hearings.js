export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('court_hearings', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    lawyer_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    case_type_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'case_types', key: 'id' },
      onDelete: 'RESTRICT',
    },
    topic: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    hearing_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('scheduled', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  });

  await queryInterface.addIndex('court_hearings', ['lawyer_id', 'hearing_at'], {
    name: 'court_hearings_lawyer_hearing_at_idx',
  });

  await queryInterface.addIndex('court_hearings', ['status', 'hearing_at'], {
    name: 'court_hearings_status_hearing_at_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('court_hearings', 'court_hearings_status_hearing_at_idx');
  await queryInterface.removeIndex('court_hearings', 'court_hearings_lawyer_hearing_at_idx');
  await queryInterface.dropTable('court_hearings');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_court_hearings_status";');
}

export default { up, down };
