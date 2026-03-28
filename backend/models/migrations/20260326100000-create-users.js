export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    full_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    role: {
      type: Sequelize.ENUM('citizen', 'lawyer', 'admin'),
      allowNull: false,
    },
    preferred_lang: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'en',
    },
    aadhaar_verified: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    google_id: {
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
  await queryInterface.dropTable('users');
  // Best-effort enum cleanup (Sequelize auto-generates type names).
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
}

export default { up, down };

