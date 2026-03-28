export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('subscriptions', {
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
    plan: {
      type: Sequelize.ENUM('freemium', 'starter', 'pro', 'enterprise'),
      allowNull: false,
      defaultValue: 'freemium',
    },
    razorpay_sub_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    starts_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('subscriptions');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_subscriptions_plan";');
}

export default { up, down };

