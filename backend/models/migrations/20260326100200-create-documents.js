export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('documents', {
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
    doc_type: {
      type: Sequelize.ENUM(
        'nda',
        'rental_agreement',
        'partnership_deed',
        'employment_contract',
        'affidavit',
        'power_of_attorney',
      ),
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    s3_key: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    encryption_key: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    signed: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    signed_at: {
      type: Sequelize.DATE,
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
  await queryInterface.dropTable('documents');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_doc_type";');
}

export default { up, down };

