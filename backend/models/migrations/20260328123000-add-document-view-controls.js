export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('documents', 'source_type', {
    type: Sequelize.ENUM('generated', 'uploaded'),
    allowNull: false,
    defaultValue: 'generated',
  });

  await queryInterface.addColumn('documents', 'mime_type', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'application/pdf',
  });

  await queryInterface.addColumn('documents', 'file_size_bytes', {
    type: Sequelize.INTEGER,
    allowNull: true,
  });

  await queryInterface.addColumn('documents', 'uploader_name', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn('documents', 'viewer_policy', {
    type: Sequelize.ENUM('view_only', 'download_allowed'),
    allowNull: false,
    defaultValue: 'view_only',
  });

  await queryInterface.addColumn('documents', 'share_scope', {
    type: Sequelize.ENUM('owner_only', 'all_lawyers'),
    allowNull: false,
    defaultValue: 'owner_only',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('documents', 'share_scope');
  await queryInterface.removeColumn('documents', 'viewer_policy');
  await queryInterface.removeColumn('documents', 'uploader_name');
  await queryInterface.removeColumn('documents', 'file_size_bytes');
  await queryInterface.removeColumn('documents', 'mime_type');
  await queryInterface.removeColumn('documents', 'source_type');

  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_share_scope";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_viewer_policy";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_source_type";');
}

export default { up, down };
