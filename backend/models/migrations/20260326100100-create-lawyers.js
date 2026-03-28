export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('lawyers', {
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
    bar_council_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    specialization: {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: true,
      defaultValue: Sequelize.literal(`'{}'::text[]`),
    },
    languages: {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: true,
      defaultValue: Sequelize.literal(`'{}'::text[]`),
    },
    state: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    city: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    rate_per_hour: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    bio: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    verified: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    calendly_url: {
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
  await queryInterface.dropTable('lawyers');
}

export default { up, down };

