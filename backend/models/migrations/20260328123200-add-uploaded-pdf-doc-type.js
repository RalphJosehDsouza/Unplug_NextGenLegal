export async function up(queryInterface) {
  await queryInterface.sequelize.query(
    "ALTER TYPE \"enum_documents_doc_type\" ADD VALUE IF NOT EXISTS 'uploaded_pdf';",
  );
}

export async function down() {
  // PostgreSQL enum values cannot be safely removed in down migration.
}

export default { up, down };
