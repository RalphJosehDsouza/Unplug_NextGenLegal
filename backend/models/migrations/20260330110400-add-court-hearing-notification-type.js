export async function up(queryInterface) {
  await queryInterface.sequelize.query(
    "ALTER TYPE \"enum_notifications_type\" ADD VALUE IF NOT EXISTS 'court_hearing';"
  );
}

export async function down() {
  // PostgreSQL enum values cannot be safely removed in-place.
}

export default { up, down };
