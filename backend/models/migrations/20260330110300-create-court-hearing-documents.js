export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('court_hearing_documents', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    },
    court_hearing_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'court_hearings', key: 'id' },
      onDelete: 'CASCADE',
    },
    required_document_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'case_type_required_documents', key: 'id' },
      onDelete: 'CASCADE',
    },
    document_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'documents', key: 'id' },
      onDelete: 'CASCADE',
    },
    uploaded_by: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    uploaded_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    },
  });

  await queryInterface.addIndex('court_hearing_documents', ['court_hearing_id', 'required_document_id'], {
    unique: true,
    name: 'court_hearing_docs_hearing_requirement_uniq',
  });

  await queryInterface.addIndex('court_hearing_documents', ['court_hearing_id'], {
    name: 'court_hearing_docs_hearing_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('court_hearing_documents', 'court_hearing_docs_hearing_idx');
  await queryInterface.removeIndex('court_hearing_documents', 'court_hearing_docs_hearing_requirement_uniq');
  await queryInterface.dropTable('court_hearing_documents');
}

export default { up, down };
