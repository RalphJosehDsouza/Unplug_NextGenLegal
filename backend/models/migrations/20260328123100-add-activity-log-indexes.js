export async function up(queryInterface) {
  await queryInterface.addIndex('activity_logs', ['resource_type', 'created_at'], {
    name: 'activity_logs_resource_type_created_at_idx',
  });

  await queryInterface.addIndex('activity_logs', ['user_id', 'created_at'], {
    name: 'activity_logs_user_id_created_at_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('activity_logs', 'activity_logs_user_id_created_at_idx');
  await queryInterface.removeIndex('activity_logs', 'activity_logs_resource_type_created_at_idx');
}

export default { up, down };
