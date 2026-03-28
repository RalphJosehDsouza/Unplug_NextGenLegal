export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('bookings', {
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
    lawyer_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'lawyers', key: 'id' },
      onDelete: 'CASCADE',
    },
    slot_time: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    duration_mins: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 60,
    },
    status: {
      type: Sequelize.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    meeting_url: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    payment_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    amount_paise: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('bookings');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bookings_status";');
}

export default { up, down };

