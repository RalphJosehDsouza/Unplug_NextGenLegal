export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('reviews', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    booking_id: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'bookings', key: 'id' },
      onDelete: 'CASCADE',
    },
    rating: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    comment: {
      type: Sequelize.TEXT,
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
  await queryInterface.dropTable('reviews');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reviews_rating";');
}

export default { up, down };

