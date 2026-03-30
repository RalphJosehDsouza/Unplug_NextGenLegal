export async function up(queryInterface) {
  await queryInterface.sequelize.query(
    "ALTER TYPE \"enum_documents_doc_type\" ADD VALUE IF NOT EXISTS 'rti_application';",
  );
  await queryInterface.sequelize.query(
    "ALTER TYPE \"enum_documents_doc_type\" ADD VALUE IF NOT EXISTS 'pwdva_application';",
  );
}

export async function down() {
  // PostgreSQL enum values cannot be safely removed.
}

export default { up, down };

